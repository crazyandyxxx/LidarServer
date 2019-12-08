from app import create_app, db
from app.models import User, Task
from flask import send_from_directory

app = create_app()

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(app.static_folder,
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Post': Post, 'Message': Message,
            'Notification': Notification, 'Task': Task}

