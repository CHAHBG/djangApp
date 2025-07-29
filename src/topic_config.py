import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from ratelimit import limits, sleep_and_retry
from urllib.robotparser import RobotFileParser
import json
import os
import re
import time
from datetime import datetime
import logging
import sqlite3
from backoff import on_exception, expo
from topic_config import TOPIC_CONFIGURATIONS, TOPIC_SPECIFIC_SOURCES

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Legitimate open educational resources
LEGITIMATE_SOURCES = {
    "fun_mooc": {
        "base_url": "https://www.fun-mooc.fr",
        "name": "FUN-MOOC (France Université Numérique)",
        "allowed": True,
        "license": "Varies, generally open for educational use",
        "search_endpoints": []
    },
    "wikiversity_fr": {
        "base_url": "https://fr.wikiversity.org",
        "name": "Wikiversity French",
        "allowed": True,
        "license": "CC BY-SA",
        "categories": []
    },
    "wikiversity_en": {
        "base_url": "https://en.wikiversity.org",
        "name": "Wikiversity English",
        "allowed": True,
        "license": "CC BY-SA",
        "sections": []
    },
    "mit_ocw": {
        "base_url": "https://ocw.mit.edu",
        "name": "MIT OpenCourseWare",
        "allowed": True,
        "license": "CC BY-NC-SA",
        "course_searches": []
    },
    "openclassrooms": {
        "base_url": "https://openclassrooms.com",
        "name": "OpenClassrooms (Free Courses Only)",
        "allowed": True,
        "license": "CC BY-SA for open courses",
        "search_terms": []
    },
    "france_ioi": {
        "base_url": "http://www.france-ioi.org",
        "name": "France IOI",
        "allowed": True,
        "license": "Free educational use",
        "sections": ["/algo/course.php", "/cours/coursAlgo.php"]
    }
}

# Update LEGITIMATE_SOURCES with topic-specific configurations
for topic, config in TOPIC_SPECIFIC_SOURCES.items():
    for source, source_config in config.items():
        if source in LEGITIMATE_SOURCES:
            LEGITIMATE_SOURCES[source].update(source_config)

class TopicSpecificScraper:
    def __init__(self, output_dir="educational_courses"):
        self.output_dir = output_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Educational Content Aggregator for Open Learning Resources',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
        os.makedirs(self.output_dir, exist_ok=True)
        self.TARGET_TOPICS = TOPIC_CONFIGURATIONS

    @on_exception(expo, requests.RequestException, max_tries=3)
    @sleep_and_retry
    @limits(calls=5, period=60)
    def fetch_page(self, url, source_name="Unknown"):
        logger.info(f"Fetching from {source_name}: {url}")
        try:
            response = self.session.get(url, timeout=25)
            response.raise_for_status()
            response.encoding = response.apparent_encoding
            return response.text
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    def check_robots_txt(self, base_url):
        try:
            robots_url = f"{base_url}/robots.txt"
            rp = RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            can_fetch = rp.can_fetch('Educational Content Aggregator', base_url)
            logger.info(f"Robots.txt check for {base_url}: {'Allowed' if can_fetch else 'Blocked'}")
            return can_fetch
        except Exception as e:
            logger.warning(f"Could not check robots.txt for {base_url}: {e}")
            return True

    def categorize_course(self, title, description=""):
        title_lower = title.lower()
        desc_lower = description.lower()
        text = f"{title_lower} {desc_lower}"
        categories = []
        for topic, config in self.TARGET_TOPICS.items():
            all_keywords = config["french_keywords"] + config["english_keywords"]
            if any(keyword in text for keyword in all_keywords):
                categories.append(topic)
        return categories if categories else ["other"]

    def scrape_fun_mooc(self, config):
        courses = []
        base_url = config['base_url']
        if not self.check_robots_txt(base_url):
            logger.warning(f"Robots.txt blocks scraping for {base_url}")
            return courses

        for search_endpoint in config.get('search_endpoints', []):
            search_url = urljoin(base_url, search_endpoint)
            html_content = self.fetch_page(search_url, config['name'])
            if not html_content:
                continue
            soup = BeautifulSoup(html_content, 'html.parser')
            course_cards = soup.select('.course-glimpse, .course-card, .course-item') or []
            for card in course_cards[:8]:
                try:
                    title_elem = card.select_one('h3, .course-title, .course-glimpse-content h3')
                    link_elem = card.select_one('a')
                    desc_elem = card.select_one('.course-glimpse-content__description, .description')
                    if title_elem and link_elem:
                        title = title_elem.get_text(strip=True)
                        course_url = urljoin(base_url, link_elem.get('href', ''))
                        description = desc_elem.get_text(strip=True)[:300] if desc_elem else ""
                        categories = self.categorize_course(title, description)
                        if categories != ["other"]:
                            courses.append({
                                'source': config['name'],
                                'title': title,
                                'url': course_url,
                                'description': description,
                                'categories': categories,
                                'license': config['license'],
                                'scraped_at': datetime.now().isoformat()
                            })
                except Exception as e:
                    logger.error(f"Error processing FUN-MOOC course card: {e}")
                time.sleep(4)
        return courses

    def scrape_wikiversity(self, config):
        courses = []
        base_url = config['base_url']
        if not self.check_robots_txt(base_url):
            return courses
        urls_to_check = []
        if 'categories' in config:
            urls_to_check.extend([urljoin(base_url, cat) for cat in config['categories']])
        if 'sections' in config:
            urls_to_check.extend([urljoin(base_url, section) for section in config['sections']])
        for url in urls_to_check:
            html_content = self.fetch_page(url, config['name'])
            if not html_content:
                continue
            soup = BeautifulSoup(html_content, 'html.parser')
            course_links = soup.select('#mw-pages a, .mw-category-group a, .NavContent a') or []
            for link in course_links[:12]:
                try:
                    href = link.get('href')
                    title = link.get_text(strip=True)
                    if href and title and len(title) > 5:
                        categories = self.categorize_course(title)
                        if categories != ["other"]:
                            full_url = urljoin(base_url, href)
                            courses.append({
                                'source': config['name'],
                                'title': title,
                                'url': full_url,
                                'description': f"Wikiversity resource: {title}",
                                'categories': categories,
                                'license': config['license'],
                                'scraped_at': datetime.now().isoformat()
                            })
                except Exception as e:
                    logger.error(f"Error processing Wikiversity link: {e}")
                time.sleep(3)
        return courses

    def scrape_mit_ocw(self, config):
        courses = []
        base_url = config['base_url']
        if not self.check_robots_txt(base_url):
            return courses
        urls_to_check = [urljoin(base_url, search) for search in config.get('course_searches', [])]
        for url in urls_to_check:
            html_content = self.fetch_page(url, config['name'])
            if not html_content:
                continue
            soup = BeautifulSoup(html_content, 'html.parser')
            try:
                if '/search/' in url:
                    search_results = soup.select('.course-title a, .search-result h3 a') or []
                    for link in search_results[:5]:
                        title = link.get_text(strip=True)
                        course_url = urljoin(base_url, link.get('href', ''))
                        categories = self.categorize_course(title)
                        if categories != ["other"]:
                            courses.append({
                                'source': config['name'],
                                'title': title,
                                'url': course_url,
                                'description': f"MIT OCW Course: {title}",
                                'categories': categories,
                                'license': config['license'],
                                'scraped_at': datetime.now().isoformat()
                            })
                else:
                    title_elem = soup.select_one('h1, .course-title, .course-header--title')
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        materials = []
                        for link in soup.select('a[href*=".pdf"], a[href*="download"]'):
                            href = link.get('href')
                            link_text = link.get_text(strip=True)
                            if href and any(keyword in href.lower() for keyword in ['lecture', 'assignment', 'reading']):
                                materials.append({
                                    'title': link_text,
                                    'url': urljoin(url, href),
                                    'type': 'pdf'
                                })
                        desc_elem = soup.select_one('.course-description, .course-info')
                        description = desc_elem.get_text(strip=True)[:400] if desc_elem else ""
                        categories = self.categorize_course(title, description)
                        if categories != ["other"]:
                            courses.append({
                                'source': config['name'],
                                'title': title,
                                'url': url,
                                'description': description,
                                'materials': materials,
                                'categories': categories,
                                'license': config['license'],
                                'scraped_at': datetime.now().isoformat()
                            })
                time.sleep(3)
            except Exception as e:
                logger.error(f"Error processing MIT OCW content from {url}: {e}")
        return courses

    def scrape_openclassrooms(self, config):
        courses = []
        base_url = config['base_url']
        if not self.check_robots_txt(base_url):
            return courses
        for term in config.get('search_terms', []):
            search_url = f"{base_url}/search/?q={term}"
            html_content = self.fetch_page(search_url, config['name'])
            if not html_content:
                continue
            soup = BeautifulSoup(html_content, 'html.parser')
            course_cards = soup.select('.course-card, .courseCard, .search-result') or []
            for card in course_cards[:6]:
                try:
                    title_elem = card.select_one('h3, .title, .course-title')
                    link_elem = card.select_one('a')
                    if title_elem and link_elem:
                        title = title_elem.get_text(strip=True)
                        course_url = urljoin(base_url, link_elem.get('href', ''))
                        free_indicators = card.select('.free, .gratuit, .premium-free')
                        if free_indicators or 'gratuit' in card.get_text().lower():
                            categories = self.categorize_course(title)
                            if categories != ["other"]:
                                courses.append({
                                    'source': config['name'],
                                    'title': title,
                                    'url': course_url,
                                    'description': f"Free course: {title}",
                                    'categories': categories,
                                    'license': config['license'],
                                    'is_free': True,
                                    'scraped_at': datetime.now().isoformat()
                                })
                except Exception as e:
                    logger.error(f"Error processing OpenClassrooms course: {e}")
                time.sleep(4)
        return courses

    def scrape_france_ioi(self, config):
        courses = []
        base_url = config['base_url']
        if not self.check_robots_txt(base_url):
            return courses
        for section in config.get('sections', []):
            url = urljoin(base_url, section)
            html_content = self.fetch_page(url, config['name'])
            if not html_content:
                continue
            soup = BeautifulSoup(html_content, 'html.parser')
            course_links = soup.select('a[href*="/algo/"], a[href*="/cours/"]') or []
            for link in course_links[:10]:
                try:
                    href = link.get('href')
                    title = link.get_text(strip=True)
                    if href and title and len(title) > 5:
                        categories = self.categorize_course(title)
                        if categories != ["other"]:
                            full_url = urljoin(base_url, href)
                            courses.append({
                                'source': config['name'],
                                'title': title,
                                'url': full_url,
                                'description': f"France IOI resource: {title}",
                                'categories': categories,
                                'license': config['license'],
                                'scraped_at': datetime.now().isoformat()
                            })
                except Exception as e:
                    logger.error(f"Error processing France IOI link: {e}")
                time.sleep(3)
        return courses

    def scrape_all_sources(self):
        courses = []
        for source_name, config in LEGITIMATE_SOURCES.items():
            if not config.get('allowed', False):
                logger.warning(f"Skipping {source_name} as it is not allowed")
                continue
            try:
                if source_name == "fun_mooc":
                    courses.extend(self.scrape_fun_mooc(config))
                elif source_name.startswith("wikiversity"):
                    courses.extend(self.scrape_wikiversity(config))
                elif source_name == "mit_ocw":
                    courses.extend(self.scrape_mit_ocw(config))
                elif source_name == "openclassrooms":
                    courses.extend(self.scrape_openclassrooms(config))
                elif source_name == "france_ioi":
                    courses.extend(self.scrape_france_ioi(config))
            except Exception as e:
                logger.error(f"Error scraping {source_name}: {e}")
        return courses

    def save_courses_to_json(self, all_courses, filename="topic_courses.json"):
        filepath = os.path.join(self.output_dir, filename)
        by_topic = {}
        sources = {}
        for course in all_courses:
            source = course['source']
            sources[source] = sources.get(source, 0) + 1
            for category in course.get('categories', ['other']):
                if category not in by_topic:
                    by_topic[category] = []
                by_topic[category].append(course)
        output_data = {
            'scraping_metadata': {
                'scraped_at': datetime.now().isoformat(),
                'total_courses': len(all_courses),
                'sources': sources,
                'topics': {topic: len(courses) for topic, courses in by_topic.items()},
                'target_topics': list(self.TARGET_TOPICS.keys()),
                'scraper_version': '2.2'
            },
            'courses_by_topic': by_topic,
            'all_courses': all_courses
        }
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        logger.info(f"Results saved to {filepath}")
        return filepath

    def generate_topic_report(self, courses):
        if not courses:
            print("No courses found.")
            return
        print(f"\n💻 EDUCATIONAL COURSES REPORT")
        print(f"Topics: PC Basics, Programming, English Learning")
        print(f"{'='*60}")
        print(f"Total courses found: {len(courses)}")
        by_topic = {}
        by_source = {}
        for course in courses:
            for category in course.get('categories', ['other']):
                if category not in by_topic:
                    by_topic[category] = []
                by_topic[category].append(course)
            source = course['source']
            by_source[source] = by_source.get(source, 0) + 1
        topic_names = {
            'computer_basics': '🖥️  PC Basics & Computer Skills',
            'programming': '💻 Programming & Development',
            'english_learning': '🇬🇧 English Learning',
            'other': '📚 Other Relevant Courses'
        }
        print(f"\nCourses by Topic:")
        for topic, topic_courses in by_topic.items():
            display_name = topic_names.get(topic, topic.title())
            print(f"  {display_name}: {len(topic_courses)} courses")
        print(f"\nCourses by Source:")
        for source, count in sorted(by_source.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {source}: {count} courses")
        print(f"\nSample Courses by Topic:")
        for topic, topic_courses in by_topic.items():
            if topic_courses:
                display_name = topic_names.get(topic, topic.title())
                print(f"\n{display_name}:")
                for i, course in enumerate(topic_courses[:3]):
                    print(f"  {i+1}. {course['title']}")
                    print(f"     Source: {course['source']}")
                    print(f"     URL: {course['url']}")
                    if len(topic_courses) > 3:
                        print(f"     ... and {len(topic_courses) - 3} more")
                        break

class DjangAppIntegrator:
    def __init__(self, db_path="database/app.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS content (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    module_id TEXT NOT NULL,
                    lesson_id TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    video_path TEXT,
                    pdf_path TEXT,
                    has_quiz BOOLEAN DEFAULT 0,
                    xp INTEGER DEFAULT 0,
                    quiz_data TEXT,
                    source_name TEXT,
                    license_info TEXT,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            conn.close()
            logger.info("Database initialized for DjangApp")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")

    def categorize_for_djangapp(self, course):
        category_to_module = {
            "computer_basics": "informatique",
            "programming": "programmation",
            "english_learning": None
        }
        for category in course.get('categories', []):
            module_id = category_to_module.get(category)
            if module_id:
                return module_id
        return self.categorize_for_djangapp_fallback(course.get('title', ''), course.get('description', ''))

    def categorize_for_djangapp_fallback(self, title, description=""):
        text = f"{title} {description}".lower()
        bureautique_keywords = ["word", "excel", "powerpoint", "office", "bureautique", "traitement texte", "tableur"]
        informatique_keywords = ["ordinateur", "windows", "système", "fichiers", "internet", "email", "sécurité"]
        programmation_keywords = ["programmation", "scratch", "python", "html", "css", "code", "algorithme"]
        if any(keyword in text for keyword in bureautique_keywords):
            return "bureautique"
        elif any(keyword in text for keyword in informatique_keywords):
            return "informatique"
        elif any(keyword in text for keyword in programmation_keywords):
            return "programmation"
        return None

    def integrate_scraped_courses(self, courses_data):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            integrated_count = 0
            errors = []
            for course in courses_data:
                module_id = self.categorize_for_djangapp(course)
                if not module_id:
                    errors.append(f"Skipped {course.get('title', '')}: No matching module")
                    continue
                lesson_id = f"{module_id}-{course.get('title', '').lower().replace(' ', '-')[:20]}-{int(time.time())}"
                quiz_data = self.generate_basic_quiz(course.get('title', ''), course.get('description', ''), module_id)
                pdf_url = next((m['url'] for m in course.get('materials', []) if m['type'] == 'pdf'), None)
                try:
                    cursor.execute('''
                        INSERT OR IGNORE INTO content 
                        (module_id, lesson_id, title, description, video_path, pdf_path, 
                         has_quiz, xp, quiz_data, source_name, license_info)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        module_id,
                        lesson_id,
                        course.get('title', ''),
                        course.get('description', '')[:500],
                        None,
                        pdf_url,
                        1 if quiz_data else 0,
                        15,
                        quiz_data,
                        course.get('source', ''),
                        course.get('license', '')
                    ))
                    integrated_count += 1
                except Exception as e:
                    errors.append(f"Error inserting course {course.get('title', '')}: {e}")
                    logger.error(f"Error inserting course {course.get('title', '')}: {e}")
            conn.commit()
            conn.close()
            logger.info(f"Integrated {integrated_count} courses into DjangApp")
            return integrated_count, errors
        except Exception as e:
            logger.error(f"Integration error: {e}")
            return 0, [f"Integration failed: {e}"]

    def generate_basic_quiz(self, title, description, module_id):
        quiz_templates = {
            "bureautique": {
                "title": f"Quiz - {title}",
                "questions": [
                    {
                        "question": f"Quel est l'usage principal de {title.lower()} ?",
                        "options": ["Bureautique", "Jeux", "Internet", "Musique"],
                        "correct": 0
                    },
                    {
                        "question": "Quelle extension est commune aux fichiers Office ?",
                        "options": [".txt", ".docx", ".jpg", ".mp3"],
                        "correct": 1
                    }
                ]
            },
            "informatique": {
                "title": f"Quiz - {title}",
                "questions": [
                    {
                        "question": f"Dans le contexte de {title.lower()}, quel aspect est prioritaire ?",
                        "options": ["Sécurité", "Rapidité", "Couleur", "Prix"],
                        "correct": 0
                    }
                ]
            },
            "programmation": {
                "title": f"Quiz - {title}",
                "questions": [
                    {
                        "question": "Qu'est-ce que la programmation ?",
                        "options": ["Écrire du code", "Jouer", "Lire", "Dormir"],
                        "correct": 0
                    }
                ]
            }
        }
        template = quiz_templates.get(module_id, quiz_templates["informatique"])
        if description:
            keywords = [word for word in description.lower().split() if len(word) > 4][:2]
            if keywords:
                template["questions"].append({
                    "question": f"Quel concept est lié à {title} ?",
                    "options": [keywords[0].capitalize(), "Autre", "Incorrect", "Faux"],
                    "correct": 0
                })
        return json.dumps(template, ensure_ascii=False)

def main_with_djangapp_integration():
    scraper = TopicSpecificScraper(output_dir="educational_courses")
    print("🎯 Scraping for DjangApp...")
    print("Modules: Bureautique, Informatique, Programmation\n")
    courses = scraper.scrape_all_sources()
    if courses:
        filepath = scraper.save_courses_to_json(courses)
        integrator = DjangAppIntegrator()
        integrated_count, errors = integrator.integrate_scraped_courses(courses)
        modules_breakdown = {}
        for course in courses:
            module_id = integrator.categorize_for_djangapp(course)
            if module_id:
                modules_breakdown[module_id] = modules_breakdown.get(module_id, 0) + 1
        scraper.generate_topic_report(courses)
        print(f"\n✅ Results for DjangApp:")
        print(f"📚 {len(courses)} courses scraped")
        print(f"🎯 {integrated_count} courses integrated into app")
        print(f"💾 Data saved: {filepath}")
        return {
            "success": len(errors) == 0,
            "total_scraped": len(courses),
            "integrated": integrated_count,
            "modules_breakdown": modules_breakdown,
            "output_file": filepath,
            "errors": errors
        }
    else:
        print("❌ No courses found")
        return {
            "success": False,
            "total_scraped": 0,
            "integrated": 0,
            "modules_breakdown": {},
            "output_file": None,
            "errors": ["No courses found"]
        }

if __name__ == "__main__":
    result = main_with_djangapp_integration()
    print(json.dumps(result, ensure_ascii=False, indent=2))