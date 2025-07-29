# topic_config.py - Specific configuration for your topics

TOPIC_CONFIGURATIONS = {
    "computer_basics": {
        "french_keywords": [
            # Basic computer terms
            "informatique", "ordinateur", "pc", "windows", "bureautique",
            "débutant", "initiation", "base", "fondamentaux", "découverte",
            "utilisation", "manipulation", "navigation", "internet", "email",
            "traitement de texte", "tableur", "présentation", "office",
            "word", "excel", "powerpoint", "libre office", "open office",
            "fichier", "dossier", "système", "installation", "configuration"
        ],
        "english_keywords": [
            "computer", "pc", "basic", "beginner", "introduction", 
            "fundamentals", "office", "windows", "internet", "email",
            "word processing", "spreadsheet", "presentation", "file",
            "folder", "system", "installation", "configuration"
        ],
        "priority": 1
    },
    
    "programming": {
        "french_keywords": [
            # Programming terms
            "programmation", "développement", "code", "coder", "développer",
            "python", "javascript", "html", "css", "java", "c++",
            "algorithmique", "logique", "scratch", "débutant", "initiation",
            "premiers pas", "apprendre", "tutorial", "cours", "formation",
            "variables", "fonctions", "boucles", "conditions", "objets",
            "web", "site web", "application", "logiciel", "script"
        ],
        "english_keywords": [
            "programming", "coding", "development", "python", "javascript",
            "html", "css", "java", "algorithm", "beginner", "introduction",
            "learn", "tutorial", "course", "variables", "functions",
            "loops", "conditions", "objects", "web", "website", "application"
        ],
        "priority": 1
    },
    
    "english_learning": {
        "french_keywords": [
            # English learning terms
            "anglais", "english", "langue anglaise", "apprendre anglais",
            "cours anglais", "débutant", "apprentissage", "formation",
            "conversation", "grammaire", "vocabulaire", "prononciation",
            "initiation", "niveau", "faux-débutant", "intermédiaire",
            "business english", "anglais professionnel", "toeic", "toefl",
            "speaking", "listening", "reading", "writing", "communication"
        ],
        "english_keywords": [
            "english", "esl", "language", "beginner", "learning", "course",
            "conversation", "grammar", "vocabulary", "pronunciation",
            "basic", "elementary", "intermediate", "business english",
            "toeic", "toefl", "speaking", "listening", "reading", "writing"
        ],
        "priority": 1
    }
}

# Specific sources for each topic
TOPIC_SPECIFIC_SOURCES = {
    "computer_basics": {
        "fun_mooc_searches": [
            "informatique+débutant",
            "bureautique",
            "ordinateur+initiation",
            "numérique+formation",
            "windows+débutant"
        ],
        "wikiversity_categories": [
            "/wiki/Catégorie:Bureautique",
            "/wiki/Catégorie:Informatique",
            "/wiki/Département:Informatique"
        ]
    },
    
    "programming": {
        "fun_mooc_searches": [
            "programmation+débutant",
            "python+initiation", 
            "développement+web",
            "javascript+cours",
            "html+css"
        ],
        "mit_ocw_courses": [
            "/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/",
            "/courses/6-00-introduction-to-computer-science-and-programming-fall-2008/",
            "/courses/6-034-artificial-intelligence-fall-2010/"
        ],
        "openclassrooms_terms": [
            "python-debutant",
            "javascript-debutant",
            "html-css-debutant",
            "programmation-debutant"
        ]
    },
    
    "english_learning": {
        "fun_mooc_searches": [
            "anglais+débutant",
            "english+course",
            "langue+anglaise",
            "business+english"
        ],
        "wikiversity_sections": [
            "/wiki/Catégorie:Anglais",
            "/wiki/English_language_learning"
        ]
    }
}

# usage_examples.py - Specific usage examples for your topics

import json
from scraper import TopicSpecificScraper

def scrape_computer_basics_only():
    """Scrape only computer basics courses"""
    print("=== Scraping Computer Basics Courses ===")
    
    scraper = TopicSpecificScraper(output_dir="computer_basics_courses")
    
    # Modify the scraper to focus only on computer basics
    original_topics = scraper.TARGET_TOPICS if hasattr(scraper, 'TARGET_TOPICS') else {}
    
    # Override categorization to focus on computer basics
    def computer_basics_filter(title, description=""):
        text = f"{title.lower()} {description.lower()}"
        computer_keywords = TOPIC_CONFIGURATIONS["computer_basics"]["french_keywords"] + \
                           TOPIC_CONFIGURATIONS["computer_basics"]["english_keywords"]
        
        if any(keyword in text for keyword in computer_keywords):
            return ["computer_basics"]
        return ["other"]
    
    # Temporarily override the categorization method
    scraper.categorize_course = computer_basics_filter
    
    courses = scraper.scrape_all_sources()
    
    if courses:
        filepath = scraper.save_courses_to_json(courses, "computer_basics_only.json")
        print(f"Found {len(courses)} computer basics courses")
        
        # Show sample results
        for course in courses[:3]:
            print(f"• {course['title']} ({course['source']})")
    
    return courses

def scrape_programming_only():
    """Scrape only programming courses"""
    print("\n=== Scraping Programming Courses ===")
    
    scraper = TopicSpecificScraper(output_dir="programming_courses")
    
    def programming_filter(title, description=""):
        text = f"{title.lower()} {description.lower()}"
        prog_keywords = TOPIC_CONFIGURATIONS["programming"]["french_keywords"] + \
                       TOPIC_CONFIGURATIONS["programming"]["english_keywords"]
        
        if any(keyword in text for keyword in prog_keywords):
            return ["programming"]
        return ["other"]
    
    scraper.categorize_course = programming_filter
    
    courses = scraper.scrape_all_sources()
    
    if courses:
        filepath = scraper.save_courses_to_json(courses, "programming_only.json")
        print(f"Found {len(courses)} programming courses")
        
        # Show sample results
        for course in courses[:3]:
            print(f"• {course['title']} ({course['source']})")
    
    return courses

def scrape_english_only():
    """Scrape only English learning courses"""
    print("\n=== Scraping English Learning Courses ===")
    
    scraper = TopicSpecificScraper(output_dir="english_courses")
    
    def english_filter(title, description=""):
        text = f"{title.lower()} {description.lower()}"
        english_keywords = TOPIC_CONFIGURATIONS["english_learning"]["french_keywords"] + \
                          TOPIC_CONFIGURATIONS["english_learning"]["english_keywords"]
        
        if any(keyword in text for keyword in english_keywords):
            return ["english_learning"]
        return ["other"]
    
    scraper.categorize_course = english_filter
    
    courses = scraper.scrape_all_sources()
    
    if courses:
        filepath = scraper.save_courses_to_json(courses, "english_only.json")
        print(f"Found {len(courses)} English learning courses")
        
        # Show sample results
        for course in courses[:3]:
            print(f"• {course['title']} ({course['source']})")
    
    return courses

def create_combined_curriculum():
    """Create a combined curriculum with all three topics"""
    print("\n=== Creating Combined Curriculum ===")
    
    # Scrape all topics
    computer_courses = scrape_computer_basics_only()
    programming_courses = scrape_programming_only()
    english_courses = scrape_english_only()
    
    # Create curriculum structure
    curriculum = {
        "curriculum_info": {
            "title": "Complete Digital Skills Curriculum",
            "description": "Learn computer basics, programming, and English",
            "total_courses": len(computer_courses) + len(programming_courses) + len(english_courses),
            "created_at": datetime.now().isoformat()
        },
        "modules": {
            "1_computer_basics": {
                "title": "💻 Computer Basics & Digital Literacy",
                "description": "Learn fundamental computer skills and digital tools",
                "courses": computer_courses,
                "estimated_duration": "4-6 weeks",
                "difficulty": "Beginner"
            },
            "2_programming": {
                "title": "🔧 Programming & Development",
                "description": "Introduction to coding and software development",
                "courses": programming_courses,
                "estimated_duration": "8-12 weeks",
                "difficulty": "Beginner to Intermediate"
            },
            "3_english": {
                "title": "🇬🇧 English Language Skills",
                "description": "Improve your English for professional and personal use",
                "courses": english_courses,
                "estimated_duration": "12-24 weeks",
                "difficulty": "Beginner to Intermediate"
            }
        }
    }
    
    # Save combined curriculum
    os.makedirs("complete_curriculum", exist_ok=True)
    with open("complete_curriculum/digital_skills_curriculum.json", 'w', encoding='utf-8') as f:
        json.dump(curriculum, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Complete curriculum created with {curriculum['curriculum_info']['total_courses']} courses")
    return curriculum

def analyze_course_sources():
    """Analyze which sources provide the best content for each topic"""
    print("\n=== Source Analysis ===")
    
    try:
        # Load data from previous scraping
        sources_analysis = {}
        
        for topic in ["computer_basics", "programming", "english_learning"]:
            try:
                with open(f"{topic}_courses/{topic}_only.json", 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    courses = data.get("all_courses", [])
                    
                    topic_sources = {}
                    for course in courses:
                        source = course['source']
                        topic_sources[source] = topic_sources.get(source, 0) + 1
                    
                    sources_analysis[topic] = topic_sources
            except FileNotFoundError:
                print(f"No data found for {topic}")
        
        # Print analysis
        print("\nSource effectiveness by topic:")
        for topic, sources in sources_analysis.items():
            print(f"\n{topic.replace('_', ' ').title()}:")
            for source, count in sorted(sources.items(), key=lambda x: x[1], reverse=True):
                print(f"  {source}: {count} courses")
    
    except Exception as e:
        print(f"Error in analysis: {e}")

def export_for_learning_platform():
    """Export data in a format suitable for a learning platform"""
    print("\n=== Exporting for Learning Platform ===")
    
    try:
        with open("complete_curriculum/digital_skills_curriculum.json", 'r', encoding='utf-8') as f:
            curriculum = json.load(f)
        
        # Create simplified format for a learning app
        platform_format = {
            "app_data": {
                "version": "1.0",
                "export_date": datetime.now().isoformat(),
                "curriculum_name": curriculum["curriculum_info"]["title"]
            },
            "learning_paths": []
        }
        
        for module_id, module_data in curriculum["modules"].items():
            learning_path = {
                "id": module_id,
                "title": module_data["title"],
                "description": module_data["description"],
                "difficulty": module_data["difficulty"],
                "estimated_duration": module_data["estimated_duration"],
                "lessons": []
            }
            
            for i, course in enumerate(module_data["courses"]):
                lesson = {
                    "lesson_id": f"{module_id}_lesson_{i+1}",
                    "title": course["title"],
                    "description": course["description"][:200] + "..." if len(course["description"]) > 200 else course["description"],
                    "source_url": course["url"],
                    "source_name": course["source"],
                    "license": course["license"],
                    "categories": course.get("categories", []),
                    "has_materials": bool(course.get("materials")),
                    "xp": 10,  # Default XP value
                    "estimated_time": "30-60 minutes"
                }
                learning_path["lessons"].append(lesson)
            
            platform_format["learning_paths"].append(learning_path)
        
        # Save platform-ready format
        with open("complete_curriculum/platform_ready_data.json", 'w', encoding='utf-8') as f:
            json.dump(platform_format, f, ensure_ascii=False, indent=2)
        
        print("✅ Platform-ready data exported to complete_curriculum/platform_ready_data.json")
        
        # Create a CSV summary for easy viewing
        import csv
        with open("complete_curriculum/courses_summary.csv", 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Module', 'Title', 'Source', 'URL', 'Categories', 'License']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for path in platform_format["learning_paths"]:
                for lesson in path["lessons"]:
                    writer.writerow({
                        'Module': path["title"],
                        'Title': lesson["title"],
                        'Source': lesson["source_name"],
                        'URL': lesson["source_url"],
                        'Categories': ', '.join(lesson["categories"]),
                        'License': lesson["license"]
                    })
        
        print("✅ CSV summary exported to complete_curriculum/courses_summary.csv")
        
    except Exception as e:
        print(f"Error in export: {e}")

# run_complete_scraping.py - Main script to run everything
def run_complete_workflow():
    """Run the complete scraping and processing workflow"""
    import os
    from datetime import datetime
    
    print("🚀 Starting Complete Educational Content Scraping Workflow")
    print("="*60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Step 1: Scrape individual topics
    print("📝 Step 1: Scraping individual topics...")
    computer_courses = scrape_computer_basics_only()
    programming_courses = scrape_programming_only() 
    english_courses = scrape_english_only()
    
    total_found = len(computer_courses) + len(programming_courses) + len(english_courses)
    print(f"\n✅ Individual scraping completed: {total_found} total courses found")
    
    # Step 2: Create combined curriculum
    print("\n📚 Step 2: Creating combined curriculum...")
    curriculum = create_combined_curriculum()
    
    # Step 3: Analyze sources
    print("\n📊 Step 3: Analyzing sources...")
    analyze_course_sources()
    
    # Step 4: Export for platform
    print("\n🔄 Step 4: Exporting for learning platform...")
    export_for_learning_platform()
    
    # Step 5: Generate final report
    print("\n📋 Step 5: Generating final report...")
    generate_final_report(curriculum)
    
    print(f"\n🎉 Workflow completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Check the 'complete_curriculum' folder for all outputs!")

def generate_final_report(curriculum):
    """Generate a comprehensive final report"""
    report = []
    report.append("EDUCATIONAL CONTENT SCRAPING REPORT")
    report.append("="*50)
    report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"Total Courses: {curriculum['curriculum_info']['total_courses']}")
    report.append("")
    
    report.append("MODULES BREAKDOWN:")
    report.append("-" * 20)
    
    for module_id, module_data in curriculum["modules"].items():
        report.append(f"{module_data['title']}")
        report.append(f"  Courses: {len(module_data['courses'])}")
        report.append(f"  Duration: {module_data['estimated_duration']}")
        report.append(f"  Difficulty: {module_data['difficulty']}")
        
        # Source breakdown for this module
        sources = {}
        for course in module_data['courses']:
            source = course['source']
            sources[source] = sources.get(source, 0) + 1
        
        report.append("  Sources:")
        for source, count in sources.items():
            report.append(f"    • {source}: {count} courses")
        report.append("")
    
    report.append("FILES CREATED:")
    report.append("-" * 15)
    report.append("• computer_basics_courses/computer_basics_only.json")
    report.append("• programming_courses/programming_only.json") 
    report.append("• english_courses/english_only.json")
    report.append("• complete_curriculum/digital_skills_curriculum.json")
    report.append("• complete_curriculum/platform_ready_data.json")
    report.append("• complete_curriculum/courses_summary.csv")
    report.append("")
    
    report.append("NEXT STEPS:")
    report.append("-" * 12)
    report.append("1. Review the courses in each category")
    report.append("2. Import platform_ready_data.json into your learning app")
    report.append("3. Download materials from courses with available resources")
    report.append("4. Create quizzes and assessments for each module")
    
    # Save report
    os.makedirs("complete_curriculum", exist_ok=True)
    with open("complete_curriculum/FINAL_REPORT.txt", 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    
    # Print report
    print('\n'.join(report))

if __name__ == "__main__":
    # Import required modules
    import os
    from datetime import datetime
    
    # Run the complete workflow
    run_complete_workflow()