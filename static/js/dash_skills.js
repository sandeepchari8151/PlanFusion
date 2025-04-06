// skills
// skills (Merged Features: Roadmaps, Reminders, Completion, Dynamic Calendar, Grid/List, Sort, Pre-Typed, API)

async function setupSkillsSection() {
    const skillInput = document.getElementById("newSkill");
    const skillList = document.getElementById("skillList");
    const addSkillButton = document.getElementById("addSkill");
    const calendarContainer = document.getElementById("calendarContainer");
    const viewToggle = document.getElementById("viewToggle");
    const sortToggle = document.getElementById("sortToggle");
    const skillSuggestions = {
        "Programming Languages": ["Python", "JavaScript", "C++", "Java", "C", "C#", "HTML", "CSS", "TypeScript", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "Perl", "Shell Scripting", "SQL", "R"],
        "Drawing": ["Sketching", "Digital Art", "Painting", "Animation", "Graphic Design"],
        "Writing": ["Fiction", "Poetry", "Technical Writing", "Journalism", "Screenwriting"],
        "Language Learning": ["Spanish", "French", "German", "Japanese", "Mandarin", "English", "Kannada", "Hindi", "Arabic", "Portuguese"],
        "Communication Skills": ["English Communication", "Kannada Communication", "Public Speaking", "Presentation Skills", "Negotiation"],
        "Interview Preparation": ["Technical Interviews", "Behavioral Interviews", "Resume Writing", "Networking"],
        "Soft Skills": ["Body Language", "Time Management", "Problem Solving", "Teamwork", "Leadership"]
    };

    if (!skillInput || !skillList || !addSkillButton || !calendarContainer || !viewToggle || !sortToggle) {
        console.error("Skills section elements not found in the DOM.");
        return;
    }

    const suggestionsList = document.createElement("datalist");
    suggestionsList.id = "skillSuggestionsList";
    document.body.appendChild(suggestionsList);

    Object.values(skillSuggestions).flat().forEach(suggestion => {
        const option = document.createElement("option");
        option.value = suggestion;
        suggestionsList.appendChild(option);
    });

    skillInput.setAttribute("list", "skillSuggestionsList");

    addSkillButton.addEventListener("click", function () {
        const skillText = skillInput.value.trim();
        if (skillText === "") return;

        const skillItem = createSkillElement(skillText);
        skillList.appendChild(skillItem);
        skillInput.value = "";
        displayCalendarSetup(skillItem);
    });

    skillList.addEventListener("click", function (event) {
        const target = event.target;
        const skillItem = target.closest(".skill-item");

        if (target.classList.contains("skill-name")) {
            editSkillName(target);
        } else if (target.classList.contains("skill-delete")) {
            skillItem.remove();
            clearCalendar(skillItem);
        } else if (target.classList.contains("skill-name") || target.classList.contains("skill-item")) {
            displayCalendar(skillItem);
        }
    });

    function createSkillElement(skillText) {
        const skillItem = document.createElement("li");
        skillItem.classList.add("skill-item");

        skillItem.innerHTML = `
            <span class="skill-name">${skillText}</span>
            <i class="ri-delete-bin-line skill-delete"></i>
        `;

        return skillItem;
    }

    function editSkillName(skillNameElement) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = skillNameElement.textContent.trim();
        input.classList.add("edit-input");

        skillNameElement.replaceWith(input);
        input.focus();

        function saveEdit() {
            const newSkillName = document.createElement("span");
            newSkillName.classList.add("skill-name");
            newSkillName.textContent = input.value.trim() || "Untitled Skill";
            input.replaceWith(newSkillName);
        }

        input.addEventListener("blur", saveEdit);
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") saveEdit();
        });
    }

    function displayCalendarSetup(skillItem) {
        calendarContainer.innerHTML = `
            <h3>Calendar Setup for ${skillItem.querySelector(".skill-name").textContent}</h3>
            <label for="calendarDays">Number of Days:</label>
            <input type="number" id="calendarDays" min="1" value="7">
            <button id="generateCalendar">Generate Calendar</button>
        `;

        const generateCalendarBtn = document.getElementById("generateCalendar");
        if (generateCalendarBtn) {
            generateCalendarBtn.addEventListener("click", function () {
                const days = parseInt(document.getElementById("calendarDays").value);
                if (days > 0) {
                    displayCalendar(skillItem, days);
                }
            });
        } else {
            console.error("Generate Calendar button not found.");
        }
    }

    async function getRoadmapSuggestions(skillName, days) {
        const roadmaps = {
            "python": [
                "Introduction to Python: Setup, basic syntax",
                "Data types, variables, and operators",
                "Control flow: if, loops, functions",
                "Object-Oriented Programming (OOP) basics",
                "Working with files and handling exceptions",
                "Introduction to libraries: NumPy, Pandas",
                "Web development with Flask or Django",
                "Database interaction with SQLite or PostgreSQL",
                "Advanced topics: generators, decorators",
                "Building a complete project",
                "Testing and debugging techniques",
                "Deployment strategies",
                "Deep dive into specific libraries",
                "Complex project development",
                "Optimizing Python code",
                "Advanced Python features",
                "Final project and review"
            ],
            "javascript": [
                "JavaScript Basics: Syntax, variables, data types",
                "DOM manipulation: selecting and modifying elements",
                "Events and event handling",
                "Asynchronous JavaScript: callbacks, promises, async/await",
                "Working with APIs: fetching data",
                "Introduction to frameworks: React, Vue, Angular",
                "Building single-page applications (SPAs)",
                "Node.js basics: server-side JavaScript",
                "Working with databases: MongoDB, PostgreSQL",
                "Advanced JavaScript concepts: closures, prototypes",
                "Building complex web applications",
                "Testing and debugging JavaScript code",
                "Performance optimization techniques",
                "Advanced framework topics",
                "Building full-stack applications",
                "Exploring new JavaScript features",
                "Final project and review"
            ],
            "c++": [
                "C++ Basics: Syntax, variables, data types",
                "Object-Oriented Programming (OOP) concepts",
                "Working with templates: generic programming",
                "Standard Template Library (STL): containers, algorithms",
                "Exception handling: managing errors",
                "Advanced C++ features: smart pointers, move semantics",
                "Building complex applications",
                "Working with libraries: Boost, Qt",
                "Performance optimization techniques",
                "Multi-threading and concurrency",
                "Building games and simulations",
                "Advanced C++ concepts",
                "Testing and debugging C++ code",
                "Exploring new C++ standards",
                "Building cross-platform applications",
                "Deep dive into specific libraries",
                "Final project and review"
            ],
            "java": [
                "Java Basics: Syntax, variables, data types",
                "Object-Oriented Programming (OOP) concepts",
                "Collections framework: lists, sets, maps",
                "Multi-threading and concurrency",
                "Database connectivity: JDBC",
                "Spring Framework: dependency injection, MVC",
                "Building web applications with Spring Boot",
                "Working with APIs: RESTful services",
                "Advanced Java features: lambdas, streams",
                "Building enterprise applications",
                "Testing and debugging Java code",
                "Performance optimization techniques",
                "Building Android applications",
                "Exploring new Java features",
                "Building microservices architecture",
                "Deep dive into specific libraries",
                "Final project and review"
            ],
            "c": [
                "C Basics: Syntax, variables, data types",
                "Pointers and memory management",
                "Working with arrays and strings",
                "File handling and input/output",
                "Structures and unions",
                "Advanced C features: bitwise operations, preprocessor",
                "Building system-level applications",
                "Working with libraries: GTK, SDL",
                "Performance optimization techniques",
                "Building embedded systems",
                "Advanced C concepts",
                "Testing and debugging C code",
                "Exploring new C standards",
                "Building cross-platform applications",
                "Deep dive into specific libraries",
                "Final project and review"
            ],
            "c#": [
                ".NET Basics: Syntax, variables, data types",
                "Language Integrated Query (LINQ)",
                "Asynchronous programming: async/await",
                "Windows Presentation Foundation (WPF) or Windows Forms",
                "ASP.NET: building web applications",
                "Entity Framework: object-relational mapping",
                "Building desktop and web applications",
                "Working with APIs: RESTful services",
                "Advanced C# features: generics, reflection",
                "Building enterprise applications",
                "Testing and debugging C# code",
                "Performance optimization techniques",
                "Building mobile applications with Xamarin",
                "Exploring new C# features",
                "Building microservices architecture",
                "Deep dive into specific libraries",
                "Final project and review"
            ],
            "html": [
                "HTML Basics: Tags, elements, attributes",
                "Forms and input elements",
                "Semantic HTML: improving accessibility",
                "HTML5 APIs: canvas, audio, video",
                "Building responsive web pages",
                "Advanced HTML features: web components, ARIA",
                "Building complex web layouts",
                "Working with frameworks: Bootstrap, Foundation",
                "Performance optimization techniques",
                "Building web applications",
                "Testing and debugging HTML code",
                "Exploring new HTML standards",
                "Building accessible web pages",
                "Deep dive into specific HTML features",
                "Building progressive web apps (PWAs)",
                "Integrating HTML with other technologies",
                "Final project and review"
            ],
            "css": [
                "CSS Basics: Selectors, properties, values",
                "Layouts: flexbox, grid",
                "Animations and transitions",
                "Responsive design: media queries",
                "CSS frameworks: Bootstrap, Tailwind CSS",
                "Advanced CSS features: variables, calc(), filters",
                "Building complex web designs",
                "Performance optimization techniques",
                "Building accessible web designs",
                "Testing and debugging CSS code",
                "Exploring new CSS standards",
                "Building CSS-in-JS solutions",
                "Deep dive into specific CSS features",
                "Building design systems",
                "Integrating CSS with other technologies",
                "Final project and review"
            ],
            "communication": [
                "Active listening and empathy",
                "Verbal communication: clarity, conciseness",
                "Non-verbal communication: body language, tone",
                "Presentation skills: storytelling, visuals",
                "Negotiation and conflict resolution",
                "Public speaking: overcoming fear, engaging audiences",
                "Building rapport and trust",
                "Effective email and written communication",
                "Facilitation and leading meetings",
                "Giving and receiving feedback",
                "Advanced communication techniques",
                "Intercultural communication",
                "Crisis communication",
                "Communication for leadership",
                "Building communication strategies",
                "Deep dive into specific communication skills",
                "Final project and review"
            ],
            "interview preparation": [
                "Resume and cover letter writing",
                "Behavioral interview questions: STAR method",
                "Technical interview questions: algorithms, data structures",
                "Mock interviews: practice and feedback",
                "Networking: building connections",
                "Job search strategies: online and offline",
                "Negotiating salary and benefits",
                "Building a personal brand",
                "Advanced interview techniques",
                "Understanding company culture",
                "Preparing for specific industries",
                "Interviewing for leadership roles",
                "Dealing with rejection",
                "Exploring new job opportunities",
                "Deep dive into specific interview skills",
                "Final project and review"
            ],
            "body language": [
                "Posture and stance",
                "Eye contact and gaze",
                "Gestures and hand movements",
                "Facial expressions and microexpressions",
                "Proxemics: personal space and distance",
                "Advanced body language: reading and influencing",
                "Building confidence and presence",
                "Understanding cultural differences",
                "Using body language in presentations",
                "Detecting deception",
                "Body language in negotiations",
                "Body language for leadership",
                "Advanced body language techniques",
                "Deep dive into specific body language cues",
                "Body language for specific situations",
                "Final project and review"
            ],
            "drawing": [
                "Basics of sketching: lines, shapes, perspective",
                "Digital art fundamentals: software, tools",
                "Painting techniques: color theory, brushwork",
                "Animation principles: timing, squash and stretch",
                "Graphic design: layout, typography, branding",
                "Advanced drawing techniques",
                "Building a portfolio",
                "Working with clients",
                "Exploring different art styles",
                "Creating digital illustrations",
                "Building 3D models",
                "Advanced animation techniques",
                "Deep dive into specific art skills",
                "Art business and marketing",
                "Integrating art with other technologies",
                "Final project and review"
            ],
            "writing": [
                "Fiction writing: plot, characters, setting",
                "Poetry writing: forms, styles, techniques",
                "Technical writing: documentation, manuals",
                "Journalism: news reporting, feature writing",
                "Screenwriting: formatting, structure, dialogue",
                "Advanced writing techniques",
                "Building a writing portfolio",
                "Working with editors and publishers",
                "Exploring different genres",
                "Creating compelling content",
                "Building a writing career",
                "Advanced storytelling techniques",
                "Deep dive into specific writing skills",
                "Writing for specific audiences",
                "Integrating writing with other technologies",
                "Final project and review"
            ],
            "language learning": [
                "Basics of the language: pronunciation, grammar",
                "Vocabulary building: common words and phrases",
                "Listening comprehension: audio and video materials",
                "Speaking practice: conversations, role-playing",
                "Reading comprehension: texts and articles",
                "Writing practice: essays, letters, stories",
                "Advanced grammar and syntax",
                "Cultural immersion: movies, music, literature",
                "Building fluency and confidence",
                "Exploring advanced vocabulary",
                "Language learning strategies",
                "Deep dive into specific language skills",
                "Language for specific purposes",
                "Integrating language with other technologies",
                "Final project and review"
            ],
            "time management": [
                "Prioritization and goal setting",
                "Scheduling and planning",
                "Dealing with distractions",
                "Delegation and outsourcing",
                "Time blocking and task batching",
                "Advanced time management techniques",
                "Building productivity habits",
                "Time management for specific situations",
                "Deep dive into specific time management skills",
                "Integrating time management with other technologies",
                "Final project and review"
            ],
            "problem solving": [
                "Identifying and defining problems",
                "Generating and evaluating solutions",
                "Decision-making and risk assessment",
                "Creative problem-solving techniques",
                "Collaborative problem-solving",
                "Advanced problem-solving techniques",
                "Building critical thinking skills",
                "Problem-solving for specific situations",
                "Deep dive into specific problem-solving skills",
                "Integrating problem-solving with other technologies",
                "Final project and review"
            ],
            "teamwork": [
                "Communication and collaboration",
                "Conflict resolution and negotiation",
                "Building trust and rapport",
                "Team leadership and facilitation",
                "Advanced teamwork techniques",
                "Building high-performing teams",
                "Teamwork for specific situations",
                "Deep dive into specific teamwork skills",
                "Integrating teamwork with other technologies",
                "Final project and review"
            ],
            "leadership": [
                "Vision and goal setting",
                "Motivation and inspiration",
                "Delegation and empowerment",
                "Communication and feedback",
                "Advanced leadership techniques",
                "Building a leadership style",
                "Leadership for specific situations",
                "Deep dive into specific leadership skills",
                "Integrating leadership with other technologies",
                "Final project and review"
            ]
        };

        const roadmap = roadmaps[skillName.toLowerCase()] || ["Add task"];
        return roadmap.slice(0, days);
    }

   
    async function displayCalendar(skillItem, days = 7) {
        const skillName = skillItem.querySelector(".skill-name").textContent;
        let calendarHTML = `<h3>Calendar for ${skillName}</h3>`;
        let suggestions = await getRoadmapSuggestions(skillName, days);
    
        calendarHTML += `<div class="calendar-grid">`;
    
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const formattedDate = date.toISOString().split('T')[0];
    
            let taskSuggestionDropdown = `<select class="task-suggestion">`;
            suggestions.forEach(suggestion => {
                taskSuggestionDropdown += `<option value="${suggestion}">${suggestion}</option>`;
            });
            taskSuggestionDropdown += `<option value="Add task">Add task</option>`;
            taskSuggestionDropdown += `</select>`;
    
            calendarHTML += `
                <div class="calendar-day">
                    <input type="date" value="${formattedDate}" class="calendar-date">
                    ${taskSuggestionDropdown}
                    <textarea class="calendar-details" placeholder="Details for this day"></textarea>
                    <input type="number" class="reminder-hours" placeholder="Hours">
                    <button class="save-day">Save</button>
                    <button class="complete-day">Complete</button>
                </div>
            `;
        }
    
        calendarHTML += `</div>`;
        calendarHTML += `<button id="toggleCalendarView">Toggle View</button>`;
    
        calendarContainer.innerHTML = calendarHTML;
    
        // Attach event listeners *after* the calendar is added to the DOM
        const completeButtons = calendarContainer.querySelectorAll(".complete-day");
    
        completeButtons.forEach(button => {
            button.addEventListener("click", function () {
                this.parentElement.classList.add("completed");
                this.parentElement.style.backgroundColor = "#e0f7de"; // Add a visual cue
                this.parentElement.style.border = "1px solid #a5d6a7"
                updateHomeSkillCounts();
            });
        });

        calendarContainer.querySelectorAll(".task-suggestion").forEach(select => {
            select.addEventListener("change", function () {
                const selectedValue = this.value;
                if (selectedValue === "Add task") {
                    const newInput = document.createElement("input");
                    newInput.type = "text";
                    newInput.value = "";
                    newInput.classList.add("task-suggestion-input");
                    this.replaceWith(newInput);
                    newInput.focus();

                    newInput.addEventListener("blur", function () {
                        const newSelect = document.createElement("select");
                        newSelect.classList.add("task-suggestion");
                        suggestions.push(this.value);
                        suggestions.forEach(suggestion => {
                            newSelect.innerHTML += `<option value="${suggestion}">${suggestion}</option>`;
                        });
                        newSelect.innerHTML += `<option value="Add task">Add task</option>`;
                        this.replaceWith(newSelect);
                        newSelect.addEventListener("change", function(){
                            if(this.value === "Add task"){
                                this.dispatchEvent(new Event("change"));
                            }
                        });
                    });
                }
            });
        });

        calendarContainer.querySelectorAll(".save-day").forEach(button => {
            button.addEventListener("click", function () {
                const dayDiv = button.parentElement;
                const date = dayDiv.querySelector(".calendar-date").value;
                const details = dayDiv.querySelector(".calendar-details").value;
                const task = dayDiv.querySelector(".task-suggestion").value;
                const hours = dayDiv.querySelector(".reminder-hours").value;
                if (date && details) {
                    skillItem.dataset.calendar = JSON.stringify({ date, details, task, hours });
                    alert("Calendar details saved!");
                }
            });
        });

        calendarContainer.querySelectorAll(".complete-day").forEach(button => {
            button.addEventListener("click", function () {
                button.parentElement.classList.add("completed");
                updateHomeSkillCounts();
            });
        });

        document.getElementById("toggleCalendarView").addEventListener("click", function() {
            const calendarGrid = calendarContainer.querySelector(".calendar-grid");
            calendarGrid.classList.toggle("list-view");
            calendarGrid.classList.toggle("grid-view");
        });
    }

    viewToggle.addEventListener("click", function () {
        skillList.classList.toggle("grid-view");
        skillList.classList.toggle("list-view");
    });

    sortToggle.addEventListener("click", function () {
        const skills = Array.from(skillList.children);
        skills.sort((a, b) => {
            const nameA = a.querySelector(".skill-name").textContent.toLowerCase();
            const nameB = b.querySelector(".skill-name").textContent.toLowerCase();
            return nameA.localeCompare(nameB);
        });
        skillList.innerHTML = "";
        skills.forEach(skill => skillList.appendChild(skill));
    });

    function clearCalendar(skillItem) {
        const skillName = skillItem.querySelector(".skill-name").textContent;
        const calendarHeader = calendarContainer.querySelector("h3");

        if (calendarHeader && calendarHeader.textContent.includes(skillName)) {
            calendarContainer.innerHTML = "";
        }
    }

    async function updateHomeSkillCounts() {
        try {
            const skillItems = skillList.querySelectorAll(".skill-item");
            let completedCount = 0;
            let remainingCount = 0;

            skillItems.forEach(item => {
                const dayDivs = calendarContainer.querySelectorAll(".calendar-day");

                let allCompleted = true;
                dayDivs.forEach(div => {
                  if(div.parentElement.parentElement === calendarContainer && div.parentElement.parentElement.previousElementSibling === item){
                    if(!div.classList.contains("completed")){
                      allCompleted = false;
                    }
                  }
                });
                if(allCompleted && dayDivs.length > 0 && dayDivs[0].parentElement.parentElement === calendarContainer){
                    completedCount++;
                } else{
                    remainingCount++;
                }
            });

            const homeSkillsRemainingCount = document.getElementById("skillsRemainingCount");
            const homeSkillsCompletedCount = document.getElementById("skillsCompletedCount");

            if (homeSkillsRemainingCount && homeSkillsCompletedCount) {
                homeSkillsRemainingCount.textContent = remainingCount;
                homeSkillsCompletedCount.textContent = completedCount;
            }
        } catch (error) {
            console.error('Error updating skill counts:', error);
        }
    }
    updateHomeSkillCounts();
}
document.addEventListener("DOMContentLoaded", setupSkillsSection);
//date 
document.addEventListener("DOMContentLoaded", function () {
    const currentDateElements = document.querySelectorAll(".currentDate");

    if (currentDateElements.length > 0) {
        const today = new Date();
        const options = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
        const formattedDate = today.toLocaleDateString("en-US", options);

        currentDateElements.forEach(element => {
            element.textContent = formattedDate;
        });
    }
});
