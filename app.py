import os
import random
import string
import logging
import bcrypt
from flask import jsonify
from datetime import timedelta
from flask import Flask, render_template, redirect, url_for, request, flash, session
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email
from flask_mail import Mail, Message
from flask_mysqldb import MySQL
from dotenv import load_dotenv

# ✅ Load environment variables (for local development)
if os.path.exists('.env'):
    load_dotenv()

# ✅ Initialize Flask App
app = Flask(__name__)

# ✅ Flask Configuration
app.config.update(
    SECRET_KEY=os.getenv('SECRET_KEY', 'default_secret_key'),
    MAIL_SERVER=os.getenv('MAIL_SERVER', 'smtp.gmail.com'),
    MAIL_PORT=int(os.getenv('MAIL_PORT', 587)),
    MAIL_USE_TLS=os.getenv('MAIL_USE_TLS', 'True') == 'True',
    MAIL_USE_SSL=os.getenv('MAIL_USE_SSL', 'False') == 'True',
    MAIL_USERNAME=os.getenv('MAIL_USERNAME'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
    MAIL_DEFAULT_SENDER=os.getenv('MAIL_DEFAULT_SENDER'),
    MYSQL_HOST=os.getenv('MYSQL_HOST', 'localhost'),
    MYSQL_USER=os.getenv('MYSQL_USER', 'root'),
    MYSQL_PASSWORD=os.getenv('MYSQL_PASSWORD', 'sandeep@1234'),
    MYSQL_DB=os.getenv('MYSQL_DB', 'sandeepdb')
)

# ✅ Initialize Flask Extensions
mail = Mail(app)
mysql = MySQL(app)

# 📝 Set up logging
logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 🔹 Flask-WTF Forms
class RegisterForm(FlaskForm):
    name = StringField("Name", validators=[DataRequired()])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Sign Up")

class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Login")

# 🛠 Register Route
@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        name = form.name.data.strip()
        email = form.email.data.strip()
        password = form.password.data.strip()

        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", [email])
        user = cursor.fetchone()

        if user:
            flash("Email already exists. Please choose a different email.", "danger")
            cursor.close()
            return render_template('register.html', form=form)

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        try:
            cursor.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)", (name, email, hashed_password))
            mysql.connection.commit()
            logging.info(f"User registered: {email}")
            flash("Registration successful! You can now log in.", "success")
            return redirect(url_for('login'))
        except Exception as e:
            logging.error(f"Registration error: {e}")
            flash("There was an error with registration. Please try again.", "danger")
        finally:
            cursor.close()

    return render_template('register.html', form=form)

# 🔹 Login Route
@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        email = form.email.data.strip()
        password = form.password.data.strip()
        remember = request.form.get('remember')

        cursor = mysql.connection.cursor()
        cursor.execute("SELECT name, email, password FROM users WHERE email = %s", [email])
        user = cursor.fetchone()
        cursor.close()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            session['user_email'] = user[1]
            session.permanent = True if remember else False

            logging.info(f"Login successful for {user[1]}")
            flash("Login successful!", "success")
            return redirect(url_for('dash'))
        else:
            logging.warning(f"Failed login attempt for {email}")
            flash("Invalid email or password.", "danger")

    return render_template('login.html', form=form)

# 🔹 Forgot Password Route
@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email']

        cursor = mysql.connection.cursor()
        cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()

        if user:
            token = ''.join(random.choices(string.ascii_letters + string.digits, k=20))
            cursor = mysql.connection.cursor()
            cursor.execute("INSERT INTO password_resets (email, token) VALUES (%s, %s)", (email, token))
            mysql.connection.commit()
            cursor.close()

            reset_link = url_for('reset_password', token=token, _external=True)
            msg = Message("Password Reset Request", recipients=[email])
            msg.body = f"Click the link below to reset your password:\n{reset_link}"
            mail.send(msg)

            logging.info(f"Password reset link sent to {email}")
            flash("A password reset link has been sent to your email.", "success")
        else:
            flash("No account found with that email.", "danger")

    return render_template('forgot_password.html')

# 🔹 Dashboard Route
@app.route('/dashboard')
def dash():
    if 'user_email' in session:
        return render_template('dash.html', user_name=session['user_email'])
    else:
        flash("You need to login first.", "danger")
        return redirect(url_for('login'))

@app.route("/dashboard_data")
def dashboard_data():
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT COUNT(*) FROM todo_list")  # Count total tasks
    total_tasks = cursor.fetchone()[0]

    cursor.close()

    return jsonify({
        "totalTasks": total_tasks,  # Total tasks count
        "remainingTasks": total_tasks,  # Updated remaining tasks count
        "learningUpdates": 5,  # Placeholder values
        "learningLastWeek": 3,
        "networkingUpdates": 4,
        "networkingLastWeek": 2,
        "overallProductivity": 80,
        "overallLastWeek": 75
    })

# 📝 To-Do Route
@app.route('/todo')
def todo():
    return render_template('todo.html')

@app.route('/learning')
def learning():
    return render_template('learning.html')

@app.route('/networking')
def networking():
    return render_template('networking.html')

# 🔹 Logout Route
@app.route('/logout')
def logout():
    session.pop('user_email', None)
    flash("You have been logged out.", "success")
    return redirect(url_for('login'))

# 📝 Task API Routes
@app.route('/get_tasks', methods=['GET'])
def get_tasks():
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, name, status FROM todo_list ORDER BY id DESC")
    tasks = [{"id": row[0], "name": row[1], "status": row[2]} for row in cursor.fetchall()]
    cursor.close()
    return jsonify({"tasks": tasks})

@app.route('/update_task_status/<int:task_id>', methods=['PUT'])
def update_task_status(task_id):
    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["completed", "pending"]:
        return jsonify({"error": "Invalid status"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("UPDATE todo_list SET status = %s WHERE id = %s", (new_status, task_id))
    mysql.connection.commit()
    cursor.close()

    return jsonify({"message": "Task status updated successfully"}), 200

# 🔹 Default Route Redirects to Login
@app.route('/')
def home():
    return redirect(url_for('login'))  # Redirect '/' to the login page

# ✅ Run Flask App
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.getenv("PORT", 5000)))
