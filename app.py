import os
import random
import string
import logging
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import (
    Flask, render_template, redirect, url_for, request,
    flash, session, jsonify
)
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email
from flask_mail import Mail, Message
from dotenv import load_dotenv
from werkzeug.utils import secure_filename  # Import secure_filename
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_cors import CORS  # Import CORS

# ✅ Load environment variables
if os.path.exists('.env'):
    load_dotenv()

# ✅ Initialize Flask App
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# ✅ Configuration
app.config.update(
    SECRET_KEY=os.getenv('SECRET_KEY', 'default_secret_key'),
    MAIL_SERVER=os.getenv('MAIL_SERVER', 'smtp.gmail.com'),
    MAIL_PORT=int(os.getenv('MAIL_PORT', 587)),
    MAIL_USE_TLS=os.getenv('MAIL_USE_TLS', 'True') == 'True',
    MAIL_USE_SSL=os.getenv('MAIL_USE_SSL', 'False') == 'True',
    MAIL_USERNAME=os.getenv('MAIL_USERNAME', 'planfusion123@gmail.com'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD', 'lvyr tleq ssxi spyw'),
    MAIL_DEFAULT_SENDER=os.getenv('MAIL_DEFAULT_SENDER', 'planfusion123@gmail.com'),
    MONGODB_URI=os.getenv('MONGODB_URI', 'mongodb://localhost:27017/sandeepdb'),  # Updated to URI
    UPLOAD_FOLDER='static/uploads',  # Folder to store uploaded avatars
    UPLOAD_FOLDER_DOCS='static/documents',  # Folder for uploaded documents
    ALLOWED_EXTENSIONS={'png', 'jpg', 'jpeg', 'gif'},  # Allowed image extensions
    ALLOWED_EXTENSIONS_DOCS={'pdf', 'doc', 'docx'}  # Allowed document extensions
)

# ✅ Initialize Extensions
mail = Mail(app)


def get_db():
    client = MongoClient(app.config['MONGODB_URI'])  # Use URI
    return client['sandeepdb']


db = get_db()  # Get the database connection

# ✅ Logging
logging.basicConfig(filename='app.log', level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

# ✅ Helpers
def find_one(collection_name, query):
    collection = db[collection_name]
    return collection.find_one(query)


def find_all(collection_name, query={}):
    collection = db[collection_name]
    return list(collection.find(query))


def insert_one(collection_name, data):
    collection = db[collection_name]
    result = collection.insert_one(data)
    return result.inserted_id


def update_one(collection_name, query, update_data):
    collection = db[collection_name]
    result = collection.update_one(query, {'$set': update_data})
    return result.modified_count


def delete_one(collection_name, query):
    collection = db[collection_name]
    result = collection.delete_one(query)
    return result.deleted_count


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'user_email' not in session:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return wrapper


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


def allowed_file_docs(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS_DOCS']


def random_string(length):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


app.jinja_env.globals['random_string'] = random_string  # Make it available in templates

# ✅ Forms
class RegisterForm(FlaskForm):
    name = StringField("Name", validators=[DataRequired()])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Sign Up")


class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Login")


# ✅ Routes
@app.route('/')
def dash():
    return render_template('dash.html', user_name="Guest")


@app.route('/register', methods=['GET', 'POST'])
def register():
    """
    Handles user registration.
    """
    form = RegisterForm()
    if form.validate_on_submit():
        name = form.name.data.strip()
        email = form.email.data.strip()
        password = form.password.data.strip()

        user = find_one("users", {"email": email})
        if user:
            flash("Email already exists. Please choose a different email.", "danger")
            return render_template('register.html', form=form)

        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        try:
            user_data = {"name": name, "email": email, "password": hashed_password}
            insert_one("users", user_data)
            logging.info(f"User registered: {email}")
            flash("Registration successful! You can now log in.", "success")
            return redirect(url_for('login'))
        except Exception as e:
            logging.error(f"Registration error: {e}")
            flash("There was an error during registration.", "danger")

    return render_template('register.html', form=form)


@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    Handles user login.
    """
    form = LoginForm()
    if form.validate_on_submit():
        email = form.email.data.strip()
        password = form.password.data.strip()
        remember = request.form.get('remember')

        user = find_one("users", {"email": email})
        if user and bcrypt.checkpw(password.encode(), user['password'].encode()):
            session['user_email'] = user['email']
            session.permanent = bool(remember)
            logging.info(f"Login successful for {user['email']}")
            flash("Login successful!", "success")
            return redirect(url_for('user_dash'))
        else:
            logging.warning(f"Failed login attempt for {email}")
            flash("Invalid email or password.", "danger")
    return render_template('login.html', form=form)


@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    """
    Handles the forgot password functionality.
    """
    if request.method == 'POST':
        email = request.form['email']
        user = find_one("users", {"email": email})

        if user:
            token = ''.join(random.choices(string.ascii_letters + string.digits, k=20))
            expiry = datetime.now() + timedelta(minutes=30)
            reset_data = {"email": email, "token": token, "expires_at": expiry}
            insert_one("password_resets", reset_data)

            reset_link = url_for('reset_password', token=token, _external=True)
            msg = Message("Password Reset Request", recipients=[email])
            msg.body = f"Click to reset your password:\n{reset_link}\nThis link expires in 30 minutes."
            mail.send(msg)

            logging.info(f"Password reset email sent to {email}")
            flash("Password reset link has been sent to your email.", "success")
        else:
            flash("No account found with that email.", "danger")

    return render_template('forgot_password.html')


@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """
    Handles resetting the user's password.
    """
    reset_data = find_one("password_resets", {"token": token})

    if not reset_data:
        flash("Invalid or expired token.", "danger")
        return redirect(url_for('login'))

    email = reset_data['email']
    expires_at = reset_data['expires_at']
    if datetime.utcnow() > expires_at:
        flash("This reset link has expired.", "danger")
        return redirect(url_for('forgot_password'))

    if request.method == 'POST':
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')

        if not new_password or not confirm_password:
            flash("Please fill out all fields.", "danger")
        elif new_password != confirm_password:
            flash("Passwords do not match.", "danger")
        else:
            hashed_password = bcrypt.hashpw(
                new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            update_one("users", {"email": email}, {"password": hashed_password})
            delete_one("password_resets", {"token": token})
            flash("Your password has been reset. Please login.", "success")
            return redirect(url_for('login'))

    return render_template('reset_password.html', token=token)


@app.route('/user_dash')
@login_required
def user_dash():
    """
    Displays the user dashboard.
    """
    email = session['user_email']
    profile = get_user_profile(email)
    app.logger.info(f"Profile in user_dash: {profile}")
    user_name = profile.get('full_name', 'Guest') if profile else "Guest"

    # Get tasks data
    tasks = list(db.dashboard_tasks.find({"user_email": email}))
    completed_tasks = [t for t in tasks if t.get('status') == 'completed']
    pending_tasks = [t for t in tasks if t.get('status') == 'pending']
    overdue_tasks = [t for t in tasks if t.get('status') == 'overdue']
    
    # Get skills data
    skills = list(skills_collection.find({"user_email": email}))
    completed_skills = [s for s in skills if s.get('status') == 'completed']
    in_progress_skills = [s for s in skills if s.get('status') == 'in_progress']
    
    # Get network data
    contacts = list(contacts_collection.find({"user_email": email}))
    goals = list(goals_collection.find({"user_email": email}))
    
    # Debug logging
    app.logger.info(f"Found {len(goals)} total goals for user {email}")
    for goal in goals:
        app.logger.info(f"Goal: {goal.get('description')}, Type: {goal.get('type')}, Status: {goal.get('status')}, Target: {goal.get('target')}, Completed: {goal.get('completed')}")
    
    current_month = datetime.now().month
    new_contacts_this_month = len([c for c in contacts if c.get('created_at', datetime.now()).month == current_month])
    meetings_attended = len([c for c in contacts if c.get('last_meeting') and c.get('last_meeting').month == current_month])
    follow_ups = len([c for c in contacts if c.get('next_meeting') and c.get('next_meeting') > datetime.now()])
    
    # Calculate completed goals with detailed logging
    completed_goals = 0
    for goal in goals:
        is_completed = (
            goal.get('status') == 'completed' or 
            (goal.get('completed', 0) >= goal.get('target', 0) and goal.get('target', 0) > 0)
        )
        if is_completed:
            completed_goals += 1
            app.logger.info(f"Counting completed goal: {goal.get('description')} (ID: {goal.get('_id')})")
        else:
            app.logger.info(f"Goal not counted as completed: {goal.get('description')} (ID: {goal.get('_id')})")
            app.logger.info(f"  Status: {goal.get('status')}")
            app.logger.info(f"  Completed: {goal.get('completed')}")
            app.logger.info(f"  Target: {goal.get('target')}")
    
    total_goals = len(goals)
    goal_achievement_percentage = round((completed_goals / total_goals * 100) if total_goals > 0 else 0)
    
    app.logger.info(f"=== Final Goals Calculation ===")
    app.logger.info(f"Completed goals: {completed_goals}")
    app.logger.info(f"Total goals: {total_goals}")
    app.logger.info(f"Achievement percentage: {goal_achievement_percentage}%")
    
    # Get upcoming meetings
    upcoming_meetings = [c for c in contacts if c.get('next_meeting') and c.get('next_meeting') > datetime.now()]
    upcoming_meetings.sort(key=lambda x: x.get('next_meeting', datetime.max))
    
    # Calculate percentages
    total_tasks = len(tasks)
    total_skills = len(skills)
    
    task_completion_percentage = round((len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 0)
    skill_completion_percentage = round((len(completed_skills) / total_skills * 100) if total_skills > 0 else 0)
    network_growth_percentage = round((new_contacts_this_month / len(contacts) * 100) if len(contacts) > 0 else 0)

    return render_template('user_dash.html',
        user_name=user_name,
        profile=profile,
        completed_tasks_count=len(completed_tasks),
        pending_tasks_count=len(pending_tasks),
        overdue_tasks_count=len(overdue_tasks),
        task_completion_percentage=task_completion_percentage,
        completed_skills_count=len(completed_skills),
        in_progress_skills_count=len(in_progress_skills),
        skill_completion_percentage=skill_completion_percentage,
        total_contacts_count=len(contacts),
        new_contacts_count=new_contacts_this_month,
        upcoming_meetings_count=len([c for c in contacts if c.get('next_meeting') and c.get('next_meeting') > datetime.now()]),
        network_growth_percentage=network_growth_percentage,
        goals_achieved_count=completed_goals,
        total_goals_count=total_goals,
        goal_achievement_percentage=goal_achievement_percentage
    )


@app.route('/dashboard_data')
@login_required
def dashboard_data():
    """
    Returns JSON data for the dashboard charts.
    """
    try:
        email = session['user_email']
        
        # Get network data with more detailed query
        app.logger.info(f"=== Starting Goals Query ===")
        app.logger.info(f"Querying goals for user: {email}")
        
        # Get all goals for the user
        goals = list(goals_collection.find({"user_email": email}))
        app.logger.info(f"Total goals found: {len(goals)}")
        
        # Group goals by type
        goals_by_type = {}
        for goal in goals:
            goal_type = goal.get('type', 'other')
            if goal_type not in goals_by_type:
                goals_by_type[goal_type] = []
            goals_by_type[goal_type].append(goal)
            app.logger.info(f"Goal found - Description: {goal.get('description')}, Type: {goal_type}, Status: {goal.get('status')}, Target: {goal.get('target')}, Completed: {goal.get('completed')}")
        
        # Calculate completed goals for each type
        completed_goals_by_type = {}
        total_goals_by_type = {}
        achievement_percentage_by_type = {}
        
        for goal_type, type_goals in goals_by_type.items():
            completed_goals = 0
            for goal in type_goals:
                is_completed = (
                    goal.get('status') == 'completed' or 
                    (goal.get('completed', 0) >= goal.get('target', 0) and goal.get('target', 0) > 0)
                )
                if is_completed:
                    completed_goals += 1
                    app.logger.info(f"Counting completed goal: {goal.get('description')} (ID: {goal.get('_id')})")
                else:
                    app.logger.info(f"Goal not counted as completed: {goal.get('description')} (ID: {goal.get('_id')})")
                    app.logger.info(f"  Status: {goal.get('status')}")
                    app.logger.info(f"  Completed: {goal.get('completed')}")
                    app.logger.info(f"  Target: {goal.get('target')}")
            
            total_goals = len(type_goals)
            completed_goals_by_type[goal_type] = completed_goals
            total_goals_by_type[goal_type] = total_goals
            achievement_percentage_by_type[goal_type] = round((completed_goals / total_goals * 100) if total_goals > 0 else 0)
        
        # Calculate total completed goals and achievement percentage
        total_completed_goals = sum(completed_goals_by_type.values())
        total_all_goals = sum(total_goals_by_type.values())
        goal_achievement_percentage = round((total_completed_goals / total_all_goals * 100) if total_all_goals > 0 else 0)
        
        app.logger.info(f"=== Final Goals Calculation ===")
        app.logger.info(f"Total completed goals: {total_completed_goals}")
        app.logger.info(f"Total all goals: {total_all_goals}")
        app.logger.info(f"Goal achievement percentage: {goal_achievement_percentage}%")
        
        # Get tasks data
        tasks = list(db.dashboard_tasks.find({"user_email": email}))
        completed_tasks = [t for t in tasks if t.get('status') == 'completed']
        pending_tasks = [t for t in tasks if t.get('status') == 'pending']
        overdue_tasks = [t for t in tasks if t.get('status') == 'overdue']
        
        # Get skills data
        skills = list(skills_collection.find({"user_email": email}))
        completed_skills = [s for s in skills if s.get('status') == 'completed']
        in_progress_skills = [s for s in skills if s.get('status') == 'in_progress']
        pending_skills = [s for s in skills if s.get('status') == 'pending']
        on_hold_skills = [s for s in skills if s.get('status') == 'on_hold']
        
        # Get network data
        contacts = list(contacts_collection.find({"user_email": email}))
        
        # Get upcoming meetings
        upcoming_meetings = [c for c in contacts if c.get('next_meeting') and c.get('next_meeting') > datetime.now()]
        upcoming_meetings.sort(key=lambda x: x.get('next_meeting', datetime.max))
        
        # Calculate percentages
        total_tasks = len(tasks)
        total_skills = len(skills)
        
        task_completion_percentage = round((len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 0)
        skill_completion_percentage = round((len(completed_skills) / total_skills * 100) if total_skills > 0 else 0)
        network_growth_percentage = round((len([c for c in contacts if c.get('created_at', datetime.now()).month == datetime.now().month]) / len(contacts) * 100) if len(contacts) > 0 else 0)

        response_data = {
            'task_data': {
                'completed': len(completed_tasks),
                'pending': len(pending_tasks),
                'overdue': len(overdue_tasks),
                'completion_percentage': task_completion_percentage,
                'pending_tasks_list': [{'name': t.get('name', 'Unnamed Task')} for t in pending_tasks]
            },
            'skill_data': {
                'completed': len(completed_skills),
                'in_progress': len(in_progress_skills),
                'pending': len(pending_skills),
                'on_hold': len(on_hold_skills),
                'completion_percentage': skill_completion_percentage,
                'in_progress_skills_list': [{'name': s.get('name', 'Unnamed Skill')} for s in in_progress_skills]
            },
            'network_data': {
                'total_contacts': len(contacts),
                'new_contacts': len([c for c in contacts if c.get('created_at', datetime.now()).month == datetime.now().month]),
                'meetings_attended': len([c for c in contacts if c.get('lastInteraction') and c.get('lastInteraction').month == datetime.now().month]),
                'follow_ups': len([c for c in contacts if c.get('next_meeting') and c.get('next_meeting') > datetime.now()]),
                'growth_percentage': network_growth_percentage,
                'completed_goals': total_completed_goals,
                'total_goals': total_all_goals,
                'goal_achievement_percentage': goal_achievement_percentage,
                'goals': {
                    'by_type': {
                        goal_type: {
                            'completed': completed_goals_by_type.get(goal_type, 0),
                            'total': total_goals_by_type.get(goal_type, 0),
                            'achievement_percentage': achievement_percentage_by_type.get(goal_type, 0),
                            'goals': [{
                                'description': g.get('description', 'Unnamed Goal'),
                                'type': g.get('type', 'other'),
                                'target': int(g.get('target', 0)),
                                'completed': 1 if (
                                    g.get('status') == 'completed' or 
                                    (g.get('completed', 0) >= g.get('target', 0) and g.get('target', 0) > 0)
                                ) else 0,
                                'deadline': g.get('deadline').strftime('%Y-%m-%d') if g.get('deadline') else None
                            } for g in type_goals]
                        } for goal_type, type_goals in goals_by_type.items()
                    }
                },
                'upcoming_meetings': [{
                    'name': m.get('name', 'Unnamed Contact'),
                    'next_meeting': m.get('next_meeting').strftime('%Y-%m-%d %H:%M') if m.get('next_meeting') else None
                } for m in upcoming_meetings]
            }
        }
        
        app.logger.info(f"=== Final Response Data ===")
        app.logger.info(f"Network data in response: {response_data['network_data']}")
        
        return jsonify(response_data)

    except Exception as e:
        app.logger.error(f"Error in dashboard_data: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/notifications/mark_read', methods=['POST'])
@login_required
def mark_notification_read():
    try:
        email = session['user_email']
        notification_id = request.json.get('notification_id')
        
        if notification_id:
            result = db.notifications.update_one(
                {
                    '_id': ObjectId(notification_id),
                    'user_email': email
                },
                {
                    '$set': {'is_read': True}
                }
            )
            
            if result.modified_count > 0:
                return jsonify({'success': True})
            else:
                return jsonify({'success': False, 'error': 'Notification not found'}), 404
                
        return jsonify({'success': False, 'error': 'No notification ID provided'}), 400
        
    except Exception as e:
        app.logger.error(f"Error marking notification as read: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/logout')
@login_required
def logout():
    """
    Logs the user out.
    """
    session.pop('user_email', None)
    flash("You have been logged out.", "success")
    return redirect(url_for('login'))


@app.route('/get_tasks', methods=['GET'])
@login_required
def get_tasks():
    """
    Retrieves all tasks from the todo_list collection.
    """
    tasks = find_all("todo_list", {})
    tasks_list = [{"id": str(task["_id"]), "name": task["name"],
                   "status": task["status"]} for task in tasks]
    return jsonify({"tasks": tasks_list}), 200


@app.route('/update_task_status/<string:task_id>', methods=['PUT'])
@login_required
def update_task_status(task_id):
    """
    Updates the status of a specific task.
    """
    data = request.get_json()
    new_status = data.get("status")
    if new_status not in ["completed", "pending"]:
        return jsonify({"error": "Invalid status"}), 400
    update_one("todo_list", {"_id": ObjectId(task_id)}, {"status": new_status})
    return jsonify({"message": "Task status updated"}), 200


@app.route('/contact', methods=['POST'])
def contact():
    """
    Handles contact form submissions.
    """
    name = request.form.get("name")
    email = request.form.get("email")
    message = request.form.get("message")

    if not name or not email or not message:
        flash("All fields are required!", "danger")
        return redirect(url_for("dash"))

    # Store or send message logic
    flash("Message sent successfully!", "success")
    return redirect(url_for("dash"))

# Profile Section
# ----------------------------------------------------------------------


def get_user_profile(email):
    """
    Retrieves a user's profile from the user_profile collection.
    """
    return find_one("user_profile", {"email": email})


def create_user_profile(data):
    """
    Creates a new user profile in the user_profile collection.
    """
    return insert_one("user_profile", data)


def update_user_profile(data, email):
    """
    Updates an existing user profile in the user_profile collection.
    """
    update_data = {
        "full_name": data.get("full_name"),
        "job_title": data.get("job_title"),
        "address": data.get("address"),
        "phone": data.get("phone"),
        "bio": data.get("bio"),
        "linkedin_url": data.get("linkedin_url"),
        "twitter_url": data.get("twitter_url"),
        "instagram_url": data.get("instagram_url"),
        "facebook_url": data.get("facebook_url"),
        "updated_at": datetime.utcnow()
    }
    if data.get("avatar_url") is not None:
        update_data["avatar_url"] = data.get("avatar_url")
    return update_one("user_profile", {"email": email}, update_data)


@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    """
    Handles user profile creation and updates.
    """
    email = session['user_email']
    profile = get_user_profile(email)
    app.logger.info(f"Profile data fetched in /profile: {profile}")

    if request.method == 'POST':
        data = request.form.to_dict()
        data['email'] = email
        app.logger.info(f"Profile data received in /profile: {data}")

        try:
            # Handle avatar upload if present
            if 'avatar' in request.files:
                file = request.files['avatar']
                if file and file.filename != '' and allowed_file(file.filename):
                    # Ensure upload directory exists
                    upload_dir = app.config['UPLOAD_FOLDER']
                    if not os.path.exists(upload_dir):
                        os.makedirs(upload_dir)
                    
                    # Generate unique filename
                    filename = secure_filename(file.filename)
                    unique_filename = f"{email}_{int(datetime.now().timestamp())}_{filename}"
                    filepath = os.path.join(upload_dir, unique_filename)
                    
                    # Save file
                    file.save(filepath)
                    app.logger.info(f"Avatar file successfully saved to: {filepath}")
                    
                    # Generate URL
                    avatar_url = url_for('static', filename=f'uploads/{unique_filename}', _external=True)
                    data['avatar_url'] = avatar_url
                    app.logger.info(f"Generated avatar_url: {avatar_url}")

            if profile:
                if update_user_profile(data, email):
                    # Return the avatar URL if it was updated
                    response_data = {"success": True, "message": "Profile updated successfully!"}
                    if 'avatar_url' in data:
                        response_data["avatar_url"] = data['avatar_url']
                    return jsonify(response_data), 200
                else:
                    return jsonify({"success": False, "error": "Error updating profile data."}), 500
            else:
                if create_user_profile(data):
                    # Return the avatar URL if it was created
                    response_data = {"success": True, "message": "Profile created successfully!"}
                    if 'avatar_url' in data:
                        response_data["avatar_url"] = data['avatar_url']
                    return jsonify(response_data), 200
                else:
                    return jsonify({"success": False, "error": "Error creating profile data."}), 500

        except Exception as e:
            app.logger.error(f"Profile update/creation error in /profile: {e}")
            return jsonify({"success": False, "error": "An error occurred while updating/creating the profile."}), 500

    return render_template('profile.html', profile=profile)


@app.route('/upload_avatar', methods=['POST'])
@login_required
def upload_avatar():
    """
    Handles uploading and saving user avatars.
    """
    try:
        email = session['user_email']
        app.logger.info(f"User email from session in upload_avatar: {email}")
        
        if 'avatar' not in request.files:
            app.logger.error("No file part in request")
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['avatar']
        if file.filename == '':
            app.logger.error("No selected file")
            return jsonify({"error": "No selected file"}), 400
            
        if not file or not allowed_file(file.filename):
            app.logger.error(f"Invalid file type: {file.filename}")
            return jsonify({"error": "Invalid file type"}), 400
            
        # Ensure upload directory exists
        upload_dir = app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
            app.logger.info(f"Created upload directory: {upload_dir}")
            
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{email}_{int(datetime.now().timestamp())}_{filename}"
        filepath = os.path.join(upload_dir, unique_filename)
        
        # Save file
        file.save(filepath)
        app.logger.info(f"Avatar file successfully saved to: {filepath}")
        
        # Generate URL - ensure it's a valid URL
        avatar_url = url_for('static', filename=f'uploads/{unique_filename}', _external=True)
        app.logger.info(f"Generated avatar_url: {avatar_url}")
        
        # Check if user profile exists
        user_profile = find_one("user_profile", {"email": email})
        if not user_profile:
            app.logger.error(f"No user profile found for email: {email}")
            return jsonify({"error": "User profile not found"}), 404
            
        # Update database
        result = update_one("user_profile", {"email": email}, {"avatar_url": avatar_url})
        if result:
            app.logger.info(f"Successfully updated avatar for user: {email}")
            return jsonify({"success": True, "avatar_url": avatar_url}), 200
        else:
            app.logger.error(f"Failed to update avatar in database for user: {email}")
            return jsonify({"error": "Failed to update avatar in database"}), 500
            
    except Exception as e:
        app.logger.error(f"Error in upload_avatar: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

contacts_collection = db.contacts
goals_collection = db.goals
skills_collection = db.skills  # Add skills collection

def format_date(date_str):
    return datetime.strptime(date_str, '%Y-%m-%d').strftime('%Y-%m-%d') if date_str else None

# --- Contacts API Endpoints ---
@app.route('/api/contacts', methods=['GET'])
@login_required
def get_contacts():
    email = session['user_email']
    contacts = list(contacts_collection.find({"user_email": email}))
    for contact in contacts:
        contact['_id'] = str(contact['_id'])
        contact['lastInteraction'] = contact.get('lastInteraction', None).strftime('%Y-%m-%d') if contact.get('lastInteraction') else None
    return jsonify(contacts)

@app.route('/api/contacts', methods=['POST'])
@login_required
def add_contact():
    try:
        email = session['user_email']
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'message': 'Name is required'}), 400
            
        # Prepare contact data
        contact_data = {
            'user_email': email,
            'name': data.get('name'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'category': data.get('category'),
            'notes': data.get('notes'),
            'created_at': datetime.utcnow()
        }
        
        # Handle lastInteraction if provided
        if data.get('lastInteraction'):
            try:
                contact_data['lastInteraction'] = datetime.strptime(data['lastInteraction'], '%Y-%m-%d %H:%M')
            except ValueError:
                return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD HH:MM'}), 400
        
        # Insert the contact
        result = contacts_collection.insert_one(contact_data)
        new_contact = contacts_collection.find_one({"_id": result.inserted_id})
        
        # Format the response
        new_contact['_id'] = str(new_contact['_id'])
        if new_contact.get('lastInteraction'):
            new_contact['lastInteraction'] = new_contact['lastInteraction'].strftime('%Y-%m-%d %H:%M')
        if new_contact.get('created_at'):
            new_contact['created_at'] = new_contact['created_at'].strftime('%Y-%m-%d %H:%M')
            
        return jsonify(new_contact), 201
        
    except Exception as e:
        app.logger.error(f"Error adding contact: {str(e)}")
        return jsonify({'message': 'An error occurred while adding the contact'}), 500

@app.route('/api/contacts/<contact_id>', methods=['DELETE'])
@login_required
def delete_contact(contact_id):
    email = session['user_email']
    result = contacts_collection.delete_one({'_id': ObjectId(contact_id), 'user_email': email})
    if result.deleted_count > 0:
        return jsonify({'message': 'Contact deleted successfully'}), 200
    return jsonify({'message': 'Contact not found'}), 404

# --- Goals API Endpoints ---
@app.route('/api/goals', methods=['GET'])
@login_required
def get_goals():
    email = session['user_email']
    goals = list(goals_collection.find({"user_email": email}))
    for goal in goals:
        goal['_id'] = str(goal['_id'])
        goal['deadline'] = goal.get('deadline', None).strftime('%Y-%m-%d') if goal.get('deadline') else None
    return jsonify(goals)

@app.route('/api/goals', methods=['POST'])
@login_required
def add_goal():
    try:
        email = session['user_email']
        data = request.get_json()
        
        # Validate required fields
        if not data.get('description') or not data.get('type'):
            return jsonify({'message': 'Description and type are required'}), 400

        # Prepare goal data
        goal_data = {
            'user_email': email,
            'description': data.get('description'),
            'type': data.get('type'),
            'target': int(data.get('target', 0)),
            'completed': int(data.get('completed', 0))
        }

        # Handle deadline if provided
        if data.get('deadline'):
            try:
                goal_data['deadline'] = datetime.strptime(data['deadline'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'message': 'Invalid deadline format. Use YYYY-MM-DD'}), 400

        # Insert the goal
        result = goals_collection.insert_one(goal_data)
        new_goal = goals_collection.find_one({"_id": result.inserted_id})
        
        # Format the response
        new_goal['_id'] = str(new_goal['_id'])
        if new_goal.get('deadline'):
            new_goal['deadline'] = new_goal['deadline'].strftime('%Y-%m-%d')
            
        return jsonify(new_goal), 201

    except Exception as e:
        app.logger.error(f"Error adding goal: {str(e)}")
        return jsonify({'message': 'An error occurred while adding the goal'}), 500

@app.route('/api/goals/<goal_id>', methods=['DELETE'])
@login_required
def delete_goal(goal_id):
    email = session['user_email']
    result = goals_collection.delete_one({'_id': ObjectId(goal_id), 'user_email': email})
    if result.deleted_count > 0:
        return jsonify({'message': 'Goal deleted successfully'}), 200
    return jsonify({'message': 'Goal not found'}), 404

@app.route('/api/goals/<goal_id>', methods=['PUT'])
@login_required
def update_goal(goal_id):
    try:
        email = session['user_email']
        data = request.get_json()
        
        # Verify the goal belongs to the user
        goal = goals_collection.find_one({'_id': ObjectId(goal_id), 'user_email': email})
        if not goal:
            return jsonify({'message': 'Goal not found or unauthorized'}), 404
            
        # Prepare update data
        update_data = {}
        
        # Update fields if provided
        if 'description' in data:
            update_data['description'] = data['description']
        if 'type' in data:
            update_data['type'] = data['type']
        if 'target' in data:
            try:
                update_data['target'] = int(data['target'])
            except (ValueError, TypeError):
                return jsonify({'message': 'Invalid target value'}), 400
        if 'completed' in data:
            try:
                update_data['completed'] = int(data['completed'])
            except (ValueError, TypeError):
                return jsonify({'message': 'Invalid completed value'}), 400
        if 'deadline' in data:
            try:
                update_data['deadline'] = datetime.strptime(data['deadline'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'message': 'Invalid deadline format. Use YYYY-MM-DD'}), 400
                
        # Update the goal
        result = goals_collection.update_one(
            {'_id': ObjectId(goal_id), 'user_email': email},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            updated_goal = goals_collection.find_one({'_id': ObjectId(goal_id)})
            if updated_goal:
                updated_goal['_id'] = str(updated_goal['_id'])
                if updated_goal.get('deadline'):
                    updated_goal['deadline'] = updated_goal['deadline'].strftime('%Y-%m-%d')
                return jsonify(updated_goal)
            else:
                return jsonify({'message': 'Error retrieving updated goal'}), 500
        else:
            return jsonify({'message': 'No changes were made to the goal'}), 200
            
    except Exception as e:
        app.logger.error(f"Error updating goal: {str(e)}")
        return jsonify({'message': f'An error occurred while updating the goal: {str(e)}'}), 500

# --- Skill API Endpoints ---
@app.route('/api/skills', methods=['GET'])
@login_required
def get_skills():
    email = session['user_email']
    skills = list(skills_collection.find({"user_email": email}))
    for skill in skills:
        skill['_id'] = str(skill['_id'])
    return jsonify(skills)

@app.route('/api/skills', methods=['POST'])
@login_required
def add_skill():
    try:
        email = session['user_email']
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'message': 'Skill name is required'}), 400
            
        # Prepare skill data with proper defaults
        skill_data = {
            'user_email': email,
            'name': data.get('name'),
            'description': data.get('description', ''),
            'status': data.get('status', 'pending'),  # Default status is pending
            'completed': int(data.get('completed', 0)),  # Ensure completed is an integer
            'created_at': datetime.utcnow()
        }
        
        app.logger.info(f"Adding new skill: {skill_data}")  # Debug log
        
        # Insert the skill
        result = skills_collection.insert_one(skill_data)
        new_skill = skills_collection.find_one({"_id": result.inserted_id})
        
        if new_skill:
            new_skill['_id'] = str(new_skill['_id'])
            app.logger.info(f"Successfully added skill: {new_skill}")  # Debug log
            return jsonify(new_skill), 201
        else:
            app.logger.error("Failed to retrieve newly created skill")
            return jsonify({'message': 'Error creating skill'}), 500
            
    except Exception as e:
        app.logger.error(f"Error adding skill: {str(e)}")
        return jsonify({'message': f'An error occurred while adding the skill: {str(e)}'}), 500

@app.route('/api/skills/<skill_id>', methods=['PUT'])
@login_required
def update_skill(skill_id):
    try:
        email = session['user_email']
        data = request.get_json()
        
        # Verify the skill belongs to the user
        skill = skills_collection.find_one({'_id': ObjectId(skill_id), 'user_email': email})
        if not skill:
            return jsonify({'message': 'Skill not found or unauthorized'}), 404
            
        # Prepare update data
        update_data = {}
        
        # Update fields if provided
        if 'name' in data:
            update_data['name'] = data['name']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'status' in data:
            update_data['status'] = data['status']
        if 'completed' in data:
            # Ensure completed is an integer between 0 and 100
            try:
                completed = int(data['completed'])
                update_data['completed'] = max(0, min(100, completed))
                
                # Update status based on completion
                if completed >= 100:
                    update_data['status'] = 'completed'
                elif completed > 0:
                    update_data['status'] = 'in_progress'
                else:
                    update_data['status'] = data.get('status', 'pending')
            except (ValueError, TypeError):
                app.logger.error(f"Invalid completion value: {data['completed']}")
                return jsonify({'message': 'Invalid completion value'}), 400
                
        app.logger.info(f"Updating skill {skill_id} with data: {update_data}")  # Debug log
        
        # Update the skill
        result = skills_collection.update_one(
            {'_id': ObjectId(skill_id), 'user_email': email},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            updated_skill = skills_collection.find_one({'_id': ObjectId(skill_id)})
            if updated_skill:
                updated_skill['_id'] = str(updated_skill['_id'])
                app.logger.info(f"Successfully updated skill: {updated_skill}")  # Debug log
                return jsonify(updated_skill)
            else:
                app.logger.error("Failed to retrieve updated skill")
                return jsonify({'message': 'Error retrieving updated skill'}), 500
        else:
            app.logger.info("No changes were made to the skill")
            return jsonify({'message': 'No changes were made to the skill'}), 200
            
    except Exception as e:
        app.logger.error(f"Error updating skill: {str(e)}")
        return jsonify({'message': f'An error occurred while updating the skill: {str(e)}'}), 500

@app.route('/api/skills/<skill_id>', methods=['DELETE'])
@login_required
def delete_skill(skill_id):
    email = session['user_email']
    result = skills_collection.delete_one({'_id': ObjectId(skill_id), 'user_email': email})
    if result.deleted_count > 0:
        return jsonify({'message': 'Skill deleted successfully'}), 200
    return jsonify({'message': 'Skill not found'}), 404

@app.route('/api/upload_document', methods=['POST'])
@login_required
def upload_document():
    email = session['user_email']
    if 'document' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
    file = request.files['document']
    if file.filename == '':
        return jsonify({'message': 'No file selected for uploading'}), 400
    if file and allowed_file_docs(file.filename):
        skill_id = request.form.get('skillId')
        if not skill_id:
            return jsonify({'message': 'Skill ID is required'}), 400

        # Verify the skill belongs to the user
        skill = skills_collection.find_one({'_id': ObjectId(skill_id), 'user_email': email})
        if not skill:
            return jsonify({'message': 'Skill not found or unauthorized'}), 404

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER_DOCS'], filename)
        os.makedirs(app.config['UPLOAD_FOLDER_DOCS'], exist_ok=True)
        try:
            file.save(filepath)
        except Exception as e:
            return jsonify({'message': f'Error saving uploaded file: {str(e)}'}), 500

        # Store the file path or a URL in the skill document in MongoDB
        document_url = url_for('static', filename=f'documents/{filename}')

        try:
            result = skills_collection.update_one(
                {'_id': ObjectId(skill_id), 'user_email': email},
                {'$push': {'documents': document_url}}
            )
            if result.modified_count > 0:
                return jsonify({'message': 'Document uploaded and associated with skill', 'url': document_url}), 200
            else:
                os.remove(filepath) # Remove the uploaded file if DB update fails
                return jsonify({'message': 'Failed to associate document with skill'}), 500
        except Exception as e:
            os.remove(filepath) # Remove the uploaded file if there's a DB error
            return jsonify({'message': f'Error updating skill document: {str(e)}'}), 500
    else:
        return jsonify({'message': 'Invalid file type'}), 400

# --- Dashboard Tasks API Endpoints ---
@app.route('/api/dashboard/tasks', methods=['GET'])
@login_required
def get_dashboard_tasks():
    """
    Retrieves all tasks for the current user from the dashboard_tasks collection.
    """
    email = session['user_email']
    tasks = list(db.dashboard_tasks.find({"user_email": email}))
    for task in tasks:
        task['_id'] = str(task['_id'])
    return jsonify(tasks)

@app.route('/api/dashboard/tasks', methods=['POST'])
@login_required
def add_dashboard_task():
    """
    Adds a new task to the dashboard_tasks collection.
    """
    try:
        email = session['user_email']
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'message': 'Task name is required'}), 400

        # Prepare task data
        task_data = {
            'user_email': email,
            'name': data.get('name'),
            'status': 'pending',
            'created_at': datetime.utcnow()
        }
        
        # Add optional fields if provided
        if data.get('priority'):
            task_data['priority'] = data.get('priority')
        if data.get('due_date'):
            task_data['due_date'] = data.get('due_date')
        if data.get('reminder'):
            task_data['reminder'] = data.get('reminder')
        if data.get('label'):
            task_data['label'] = data.get('label')

        # Insert the task
        result = db.dashboard_tasks.insert_one(task_data)
        new_task = db.dashboard_tasks.find_one({"_id": result.inserted_id})
        
        # Format the response
        new_task['_id'] = str(new_task['_id'])
            
        return jsonify(new_task), 201

    except Exception as e:
        app.logger.error(f"Error adding dashboard task: {str(e)}")
        return jsonify({'message': 'An error occurred while adding the task'}), 500

@app.route('/api/dashboard/tasks/<task_id>', methods=['PUT'])
@login_required
def update_dashboard_task(task_id):
    """
    Updates a specific task in the dashboard_tasks collection.
    """
    try:
        email = session['user_email']
        data = request.get_json()
        
        # Verify the task belongs to the user
        task = db.dashboard_tasks.find_one({'_id': ObjectId(task_id), 'user_email': email})
        if not task:
            return jsonify({'message': 'Task not found or unauthorized'}), 404
        
        # Prepare update data
        update_data = {}
        
        # Update only provided fields
        if 'name' in data:
            update_data['name'] = data['name']
        if 'status' in data:
            update_data['status'] = data['status']
        if 'priority' in data:
            update_data['priority'] = data['priority']
        if 'due_date' in data:
            update_data['due_date'] = data['due_date']
        if 'reminder' in data:
            update_data['reminder'] = data['reminder']
        if 'label' in data:
            update_data['label'] = data['label']
            
        # Update the task
        result = db.dashboard_tasks.update_one(
            {'_id': ObjectId(task_id), 'user_email': email},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            updated_task = db.dashboard_tasks.find_one({'_id': ObjectId(task_id)})
            updated_task['_id'] = str(updated_task['_id'])
            return jsonify(updated_task), 200
        else:
            return jsonify({'message': 'No changes were made to the task'}), 200
            
    except Exception as e:
        app.logger.error(f"Error updating dashboard task: {str(e)}")
        return jsonify({'message': 'An error occurred while updating the task'}), 500

@app.route('/api/dashboard/tasks/<task_id>', methods=['DELETE'])
@login_required
def delete_dashboard_task(task_id):
    """
    Deletes a specific task from the dashboard_tasks collection.
    """
    try:
        email = session['user_email']
        
        # Verify the task belongs to the user
        task = db.dashboard_tasks.find_one({'_id': ObjectId(task_id), 'user_email': email})
        if not task:
            return jsonify({'message': 'Task not found or unauthorized'}), 404
            
        # Delete the task
        result = db.dashboard_tasks.delete_one({'_id': ObjectId(task_id), 'user_email': email})
        
        if result.deleted_count > 0:
            return jsonify({'message': 'Task deleted successfully'}), 200
        else:
            return jsonify({'message': 'Task not found'}), 404
            
    except Exception as e:
        app.logger.error(f"Error deleting dashboard task: {str(e)}")
        return jsonify({'message': 'An error occurred while deleting the task'}), 500

# ✅ Custom Error Handling
@app.errorhandler(404)
def page_not_found(e):
    """
    Custom handler for 404 Not Found errors.
    """
    return render_template("404.html"), 404

# ✅ Run App
if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)