import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs
from ratelimit import limits, sleep_and_retry
from urllib.robotparser import RobotFileParser
import json
import os
import re
import time
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Legitimate open educational resources for PC skills, programming, and English
LEGITIMATE_SOURCES = {
    "fun_mooc": {
        "base_url": "https://www.fun-mooc.fr",
        "name": "FUN-MOOC (France Université Numérique)",
        "allowed": True,
        "license": "Varies, generally open for educational use",
        "search_endpoints": [
            "/courses/?search=informatique",
            "/courses/?search=programmation", 
            "/courses/?search=ordinateur",
            "/courses/?search=anglais",
            "/courses/?search=english",
            "/courses/?search=numérique",
            "/courses/?search=python",
            "/courses/?search=bureautique"
        ],
        "selectors": {
            "course_cards": ".course-glimpse, .course-card, .course-item",
            "title": "h3, .course-title, .course-glimpse-content h3",
            "link": "a",
            "description": ".course-glimpse-content__description, .description"
        }
    },
    "wikiversity_fr": {
        "base_url": "https://fr.wikiversity.org",
        "name": "Wikiversity French",
        "allowed": True,
        "license": "CC BY-SA",
        "categories": [
            "/wiki/Catégorie:Informatique",
            "/wiki/Catégorie:Programmation",
            "/wiki/Catégorie:Bureautique",
            "/wiki/Catégorie:Anglais",
            "/wiki/Catégorie:Langues",
            "/wiki/Département:Informatique",
            "/wiki/Faculté:Informatique"
        ],
        "selectors": {
            "course_links": "#mw-pages a, .mw-category-group a, .NavContent a",
            "content": "#mw-content-text"
        }
    },
    "wikiversity_en": {
        "base_url": "https://en.wikiversity.org",
        "name": "Wikiversity English",
        "allowed": True,
        "license": "CC BY-SA",
        "sections": [
            "/wiki/Computer_Science",
            "/wiki/Programming",
            "/wiki/English_language_learning",
            "/wiki/Basic_computer_skills",
            "/wiki/Category:Computer_science",
            "/wiki/School:Computer_Science"
        ]
    },
    "mit_ocw": {
        "base_url": "https://ocw.mit.edu",
        "name": "MIT OpenCourseWare",
        "allowed": True,
        "license": "CC BY-NC-SA",
        "course_searches": [
            "/search/?q=introduction+programming",
            "/search/?q=computer+science+basics",
            "/search/?q=python+programming",
            "/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/",
            "/courses/6-00-introduction-to-computer-science-and-programming-fall-2008/"
        ]
    },
    "openclassrooms": {
        "base_url": "https://openclassrooms.com",
        "name": "OpenClassrooms (Free Courses Only)",
        "allowed": True,
        "license": "CC BY-SA for open courses",
        "search_terms": [
            "informatique-debutant",
            "programmation-debutant", 
            "python-debutant",
            "anglais-debutant",
            "bureautique",
            "ordinateur-debutant"
        ]
    },
    "france_ioi": {
        "base_url": "http://www.france-ioi.org",
        "name": "France IOI",
        "allowed": True,
        "license": "Free educational use",
        "sections": [
            "/algo/course.php",
            "/cours/coursAlgo.php"
        ]
    }
}

# Target topics with French keywords
TARGET_TOPICS = {
    "computer_basics": {
        "keywords": [
            "informatique", "ordinateur", "pc", "windows", "bureautique", 
            "débutant", "initiation", "base", "fondamentaux", "découverte",
            "utilisation", "manipulation", "navigation", "internet", "email"
        ],
        "english_keywords": [
            "computer", "pc", "basic", "beginner", "introduction", 
            "fundamentals", "office", "windows", "internet", "email"
        ]
    },
    "programming": {
        "keywords": [
            "programmation", "développement", "code", "python", "javascript",
            "html", "css", "algorithmique", "logique", "scratch", "débutant",
            "initiation", "premiers", "apprendre", "coder", "développer"
        ],
        "english_keywords": [
            "programming", "coding", "development", "python", "javascript",
            "html", "css", "algorithm", "beginner", "introduction", "learn"
        ]
    },
    "english_learning": {
        "keywords": [
            "anglais", "english", "langue", "débutant", "apprentissage",
            "conversation", "grammaire", "vocabulaire", "prononciation",
            "initiation", "niveau", "faux-débutant", "intermédiaire"
        ],
        "english_keywords": [
            "english", "language", "beginner", "learning", "conversation",
            "grammar", "vocabulary", "pronunciation", "basic", "elementary"
        ]
    }
}

class TopicSpecificScraper:
    def __init__(self, output_dir="topic_courses"):
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

    @sleep_and_retry
    @limits(calls=2, period=60)  # Very conservative rate limiting
    def fetch_page(self, url, source_name="Unknown"):
        """Fetch a web page with proper error handling and rate limiting"""
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
        """Check robots.txt compliance"""
        try:
            robots_url = f"{base_url}/robots.txt"
            rp = RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            
            user_agent = 'Educational Content Aggregator'
            can_fetch = rp.can_fetch(user_agent, base_url)
            logger.info(f"Robots.txt check for {base_url}: {'Allowed' if can_fetch else 'Blocked'}")
            return can_fetch
        except Exception as e:
            logger.warning(f"Could not check robots.txt for {base_url}: {e}")
            return True

    def categorize_course(self, title, description=""):
        """Categorize a course based on its title and description"""
        title_lower = title.lower()
        desc_lower = description.lower()
        text = f"{title_lower} {desc_lower}"
        
        categories = []
        
        # Check each topic
        for topic, keywords in TARGET_TOPICS.items():
            all_keywords = keywords["keywords"] + keywords["english_keywords"]
            if any(keyword in text for keyword in all_keywords):
                categories.append(topic)
        
        return categories if categories else ["other"]

    def scrape_fun_mooc(self, config):
        """Scrape FUN-MOOC for relevant courses"""
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
            selectors = config.get('selectors', {})
            
            # Try multiple selectors for course cards
            course_cards = (soup.select(selectors.get('course_cards', '.course-card')) or
                           soup.select('.course-glimpse') or
                           soup.select('.course-item'))
            
            for card in course_cards[:8]:  # Limit per search
                try:
                    title_elem = (card.select_one(selectors.get('title', 'h3')) or
                                card.select_one('h3') or 
                                card.select_one('.title'))
                    
                    link_elem = card.select_one(selectors.get('link', 'a')) or card.select_one('a')
                    desc_elem = card.select_one(selectors.get('description', '.description'))
                    
                    if title_elem and link_elem:
                        title = title_elem.get_text(strip=True)
                        course_url = urljoin(base_url, link_elem.get('href', ''))
                        description = desc_elem.get_text(strip=True) if desc_elem else ""
                        
                        # Categorize the course
                        categories = self.categorize_course(title, description)
                        
                        if categories != ["other"]:  # Only keep relevant courses
                            courses.append({
                                'source': config['name'],
                                'title': title,
                                'url': course_url,
                                'description': description[:300],  # Limit description length
                                'categories': categories,
                                'license': config['license'],
                                'scraped_at': datetime.now().isoformat()
                            })
                
                except Exception as e:
                    logger.error(f"Error processing FUN-MOOC course card: {e}")
                    continue
            
            time.sleep(4)  # Be extra respectful
        
        return courses

    def scrape_wikiversity(self, config):
        """Scrape Wikiversity for relevant educational resources"""
        courses = []
        base_url = config['base_url']
        
        if not self.check_robots_txt(base_url):
            return courses

        # Get URLs to check
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
            
            # Look for course/lesson links
            selectors = config.get('selectors', {})
            course_links = soup.select(selectors.get('course_links', 'a'))
            
            for link in course_links[:12]:  # Limit results per category
                try:
                    href = link.get('href')
                    title = link.get_text(strip=True)
                    
                    if href and title and len(title) > 5:
                        # Categorize to filter relevant content
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
                    continue
            
            time.sleep(3)
        
        return courses

    def scrape_mit_ocw(self, config):
        """Scrape MIT OCW for introductory programming and CS courses"""
        courses = []
        base_url = config['base_url']
        
        if not self.check_robots_txt(base_url):
            return courses

        # Check specific intro courses and search results
        urls_to_check = []
        if 'course_searches' in config:
            urls_to_check.extend([urljoin(base_url, search) for search in config['course_searches']])

        for url in urls_to_check:
            html_content = self.fetch_page(url, config['name'])
            
            if not html_content:
                continue
                
            soup = BeautifulSoup(html_content, 'html.parser')
            
            try:
                # For search results pages
                if '/search/' in url:
                    search_results = soup.select('.course-title a, .search-result h3 a')
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
                
                # For specific course pages
                else:
                    title_elem = soup.select_one('h1, .course-title, .course-header--title')
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        
                        # Look for downloadable materials
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
                        
                        # Get course description
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
                
            except Exception as e:
                logger.error(f"Error processing MIT OCW content from {url}: {e}")
                continue
            
            time.sleep(3)
        
        return courses

    def scrape_openclassrooms(self, config):
        """Scrape OpenClassrooms for free beginner courses"""
        courses = []
        base_url = config['base_url']
        
        if not self.check_robots_txt(base_url):
            return courses

        # Search for beginner courses in our target topics
        search_terms = config.get('search_terms', [])
        
        for term in search_terms:
            search_url = f"{base_url}/search/?q={term}"
            html_content = self.fetch_page(search_url, config['name'])
            
            if not html_content:
                continue
                
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Look for course cards (adjust selectors as needed)
            course_cards = soup.select('.course-card, .courseCard, .search-result')
            
            for card in course_cards[:6]:  # Limit per search term
                try:
                    title_elem = card.select_one('h3, .title, .course-title')
                    link_elem = card.select_one('a')
                    
                    if title_elem and link_elem:
                        title = title_elem.get_text(strip=True)
                        course_url = urljoin(base_url, link_elem.get('href', ''))
                        
                        # Look for "gratuit" or "free" indicators
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
                    continue
            
            time.sleep(4)
        
        return courses

    def save_courses_to_json(self, all_courses, filename="topic_courses.json"):
        """Save scraped courses to JSON file with topic organization"""
        filepath = os.path.join(self.output_dir, filename)
        
        # Organize courses by topic
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
                'target_topics': ['computer_basics', 'programming', 'english_learning'],
                'scraper_version': '2.1'
            },
            'courses_by_topic': by_topic,
            'all_courses': all_courses
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Results saved to {filepath}")
        return filepath

    def scrape_all_sources(self):
        """Main method to scrape all legitimate sources for target topics"""
        all_courses = []
        
        logger.info("Starting topic-specific scraping for PC basics, programming, and English...")
        
        for source_key, config in LEGITIMATE_SOURCES.items():
            if not config.get('allowed', False):
                continue
                
            logger.info(f"\n=== Scraping {config['name']} ===")
            
            try:
                if source_key == "fun_mooc":
                    courses = self.scrape_fun_mooc(config)
                elif source_key.startswith("wikiversity"):
                    courses = self.scrape_wikiversity(config)
                elif source_key == "mit_ocw":
                    courses = self.scrape_mit_ocw(config)
                elif source_key == "openclassrooms":
                    courses = self.scrape_openclassrooms(config)
                else:
                    logger.info(f"Scraper for {source_key} not implemented yet")
                    courses = []
                
                all_courses.extend(courses)
                logger.info(f"Found {len(courses)} relevant courses from {config['name']}")
                
            except Exception as e:
                logger.error(f"Error scraping {config['name']}: {e}")
            
            # Be respectful between sources
            time.sleep(6)
        
        return all_courses

    def generate_topic_report(self, courses):
        """Generate a detailed report organized by topics"""
        if not courses:
            print("No courses found.")
            return
        
        print(f"\n💻 EDUCATIONAL COURSES REPORT")
        print(f"Topics: PC Basics, Programming, English Learning")
        print(f"{'='*60}")
        print(f"Total courses found: {len(courses)}")
        
        # Organize by topic
        by_topic = {}
        by_source = {}
        
        for course in courses:
            # Group by topics
            for category in course.get('categories', ['other']):
                if category not in by_topic:
                    by_topic[category] = []
                by_topic[category].append(course)
            
            # Group by source
            source = course['source']
            by_source[source] = by_source.get(source, 0) + 1
        
        print(f"\nCourses by Topic:")
        topic_names = {
            'computer_basics': '🖥️  PC Basics & Computer Skills',
            'programming': '💻 Programming & Development',
            'english_learning': '🇬🇧 English Learning',
            'other': '📚 Other Relevant Courses'
        }
        
        for topic, topic_courses in by_topic.items():
            display_name = topic_names.get(topic, topic.title())
            print(f"  {display_name}: {len(topic_courses)} courses")
        
        print(f"\nCourses by Source:")
        for source, count in by_source.items():
            print(f"  • {source}: {count} courses")
        
        print(f"\nSample Courses by Topic:")
        for topic, topic_courses in by_topic.items():
            if topic_courses:
                display_name = topic_names.get(topic, topic.title())
                print(f"\n{display_name}:")
                for i, course in enumerate(topic_courses[:3]):  # Show top 3 per topic
                    print(f"  {i+1}. {course['title']}")
                    print(f"     Source: {course['source']}")
                    print(f"     URL: {course['url']}")
                    if len(topic_courses) > 3:
                        print(f"     ... and {len(topic_courses) - 3} more")
                        break

def main():
    """Main execution function"""
    scraper = TopicSpecificScraper(output_dir="educational_courses")
    
    print("🎯 Scraping educational courses for:")
    print("   • PC Basics & Computer Skills")
    print("   • Programming & Development") 
    print("   • English Learning")
    print("From legitimate open educational resources...\n")
    
    # Scrape all sources
    courses = scraper.scrape_all_sources()
    
    if courses:
        # Save results
        filepath = scraper.save_courses_to_json(courses)
        
        # Generate report
        scraper.generate_topic_report(courses)
        
        print(f"\n✅ Results saved to: {filepath}")
        print(f"Found {len(courses)} relevant educational courses!")
    else:
        print("❌ No courses found. Check your internet connection and try again.")

if __name__ == "__main__":
    main()