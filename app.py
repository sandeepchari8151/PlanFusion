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
from flask_mysqldb import MySQL
from dotenv import load_dotenv

# ✅ Load environment variables
if os.path.exists('.env'):
    load_dotenv()

# ✅ Initialize Flask App
app = Flask(__name__)

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
    MYSQL_HOST=os.getenv('MYSQL_HOST', 'localhost'),
    MYSQL_USER=os.getenv('MYSQL_USER', 'root'),
    MYSQL_PASSWORD=os.getenv('MYSQL_PASSWORD', 'sandeep@1234'),
    MYSQL_DB=os.getenv('MYSQL_DB', 'sandeepdb')
)

# ✅ Initialize Extensions
mail = Mail(app)
mysql = MySQL(app)

# ✅ Logging
logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ✅ Helpers
def query_db(query, args=(), one=False):
    cursor = mysql.connection.cursor()
    cursor.execute(query, args)
    rv = cursor.fetchall()
    cursor.close()
    return (rv[0] if rv else None) if one else rv

def execute_db(query, args=()):
    cursor = mysql.connection.cursor()
    cursor.execute(query, args)
    mysql.connection.commit()
    cursor.close()

def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'user_email' not in session:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return wrapper

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
    form = RegisterForm()
    if form.validate_on_submit():
        name = form.name.data.strip()
        email = form.email.data.strip()
        password = form.password.data.strip()

        user = query_db("SELECT * FROM users WHERE email = %s", [email], one=True)
        if user:
            flash("Email already exists. Please choose a different email.", "danger")
            return render_template('register.html', form=form)

        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        try:
            execute_db("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)", (name, email, hashed_password))
            logging.info(f"User registered: {email}")
            flash("Registration successful! You can now log in.", "success")
            return redirect(url_for('login'))
        except Exception as e:
            logging.error(f"Registration error: {e}")
            flash("There was an error during registration.", "danger")

    return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        email = form.email.data.strip()
        password = form.password.data.strip()
        remember = request.form.get('remember')

        user = query_db("SELECT name, email, password FROM users WHERE email = %s", [email], one=True)
        if user and bcrypt.checkpw(password.encode(), user[2].encode()):
            session['user_email'] = user[1]
            session.permanent = bool(remember)
            logging.info(f"Login successful for {user[1]}")
            flash("Login successful!", "success")
            return redirect(url_for('user_dash'))
        else:
            logging.warning(f"Failed login attempt for {email}")
            flash("Invalid email or password.", "danger")
    return render_template('login.html', form=form)

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email']
        user = query_db("SELECT email FROM users WHERE email = %s", [email], one=True)

        if user:
            token = ''.join(random.choices(string.ascii_letters + string.digits, k=20))
            expiry = datetime.now() + timedelta(minutes=30)
            execute_db("INSERT INTO password_resets (email, token, expires_at) VALUES (%s, %s, %s)", (email, token, expiry))

            reset_link = url_for('reset_password', token=token, _external=True)
            msg = Message("Password Reset Request", recipients=[email])
            msg.body = f"Click to reset your password:\n{reset_link}\nThis link expires in 30 minutes."
            mail.send(msg)

            logging.info(f"Password reset email sent to {email}")
            flash("Password reset link has been sent to your email.", "success")
        else:
            flash("No account found with that email.", "danger")

    return render_template('forgot_password.html')

from datetime import datetime

@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT email, expires_at FROM password_resets WHERE token = %s", (token,))
    data = cursor.fetchone()

    if not data:
        flash("Invalid or expired token.", "danger")
        return redirect(url_for('login'))

    email, expires_at = data
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
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("UPDATE users SET password = %s WHERE email = %s", (hashed_password, email))
            cursor.execute("DELETE FROM password_resets WHERE token = %s", (token,))
            mysql.connection.commit()
            flash("Your password has been reset. Please login.", "success")
            return redirect(url_for('login'))

    cursor.close()
    return render_template('reset_password.html', token=token)


@app.route('/user_dash')
@login_required
def user_dash():
    email = session['user_email']
    profile = get_user_profile(email)
    user_name = profile.get('full_name', 'Guest') if profile else "Guest"
    return render_template('user_dash.html', user_name=user_name, profile=profile)


@app.route("/dashboard_data")
@login_required
def dashboard_data():
    total_tasks = query_db("SELECT COUNT(*) FROM todo_list", one=True)[0]
    return jsonify({
        "totalTasks": total_tasks,
        "remainingTasks": total_tasks,  # Placeholder logic
        "learningUpdates": 5,
        "learningLastWeek": 3,
        "networkingUpdates": 4,
        "networkingLastWeek": 2,
        "overallProductivity": 80,
        "overallLastWeek": 75
    }), 200

@app.route('/logout')
@login_required
def logout():
    session.pop('user_email', None)
    flash("You have been logged out.", "success")
    return redirect(url_for('login'))

@app.route('/get_tasks', methods=['GET'])
@login_required
def get_tasks():
    tasks = query_db("SELECT id, name, status FROM todo_list ORDER BY id DESC")
    return jsonify({"tasks": [{"id": t[0], "name": t[1], "status": t[2]} for t in tasks]}), 200

@app.route('/update_task_status/<int:task_id>', methods=['PUT'])
@login_required
def update_task_status(task_id):
    data = request.get_json()
    new_status = data.get("status")
    if new_status not in ["completed", "pending"]:
        return jsonify({"error": "Invalid status"}), 400
    execute_db("UPDATE todo_list SET status = %s WHERE id = %s", (new_status, task_id))
    return jsonify({"message": "Task status updated"}), 200

@app.route('/contact', methods=['POST'])
def contact():
    name = request.form.get("name")
    email = request.form.get("email")
    message = request.form.get("message")

    if not name or not email or not message:
        flash("All fields are required!", "danger")
        return redirect(url_for("dash"))

    # Store or send message logic
    flash("Message sent successfully!", "success")
    return redirect(url_for("dash"))

#profile section 
def get_user_profile(email):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM user_profile WHERE email = %s", [email])
    row = cursor.fetchone()
    if row:
        columns = [desc[0] for desc in cursor.description]
        profile = dict(zip(columns, row))
    else:
        profile = None
    cursor.close()
    return profile

def create_user_profile(data):
    execute_db("""
        INSERT INTO user_profile (full_name, job_title, avatar_url, email, phone, address, bio, linkedin_url, twitter_url, instagram_url, facebook_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        data.get("full_name"), data.get("job_title"), data.get("avatar_url"), data.get("email"),
        data.get("phone"), data.get("address"), data.get("bio"),
        data.get("linkedin_url"), data.get("twitter_url"),
        data.get("instagram_url"), data.get("facebook_url")
    ))

def update_user_profile(data, email):
    execute_db("""
        UPDATE user_profile SET full_name=%s, job_title=%s, avatar_url=%s, phone=%s,
        address=%s, bio=%s, linkedin_url=%s, twitter_url=%s, instagram_url=%s, facebook_url=%s,
        updated_at=NOW() WHERE email=%s
    """, (
        data.get("full_name"), data.get("job_title"), data.get("avatar_url"), data.get("phone"),
        data.get("address"), data.get("bio"),
        data.get("linkedin_url"), data.get("twitter_url"),
        data.get("instagram_url"), data.get("facebook_url"), email
    ))

    
@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    email = session['user_email']
    profile = get_user_profile(email)

    if request.method == 'POST':
        data = request.form.to_dict()
        data['email'] = email

        try:
            if profile:
                update_user_profile(data, email)
            else:
                create_user_profile(data)

            return jsonify({"success": True, "message": "Profile updated successfully!"}), 200

        except Exception as e:
            app.logger.error(f"Profile update error: {e}")
            return jsonify({"success": False, "error": "An error occurred while updating the profile."}), 500

    return render_template('profile.html', profile=profile)





# ✅ Custom Error Handling
@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404

# ✅ Run App
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.getenv("PORT", 5000)))