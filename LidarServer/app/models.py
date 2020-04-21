from datetime import datetime
from hashlib import md5
import json
from time import time
from flask import current_app
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    last_seen = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return '<User {}>'.format(self.username)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Task(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    mode = db.Column(db.String(36), index=True)
    description = db.Column(db.String(128))
    laser_freq = db.Column(db.Integer)
    duration = db.Column(db.Integer)
    resolution = db.Column(db.Float)
    bin_length = db.Column(db.Integer)
    start_time = db.Column(db.DateTime, default=datetime.now)
    end_time = db.Column(db.DateTime, default=datetime.now)
    data_num = db.Column(db.Integer)
    ver_start_angle = db.Column(db.Float)
    ver_end_angle = db.Column(db.Float)
    ver_step = db.Column(db.Float)
    hor_start_angle = db.Column(db.Float)
    hor_end_angle = db.Column(db.Float)
    hor_step = db.Column(db.Float)
    complete = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return '<Task {}>'.format(self.id+' '+self.mode+' '+self.data_num)


class TaskData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.String(36), db.ForeignKey('task.id'))
    timestamp = db.Column(db.DateTime, index=True, default=datetime.now)
    longitude = db.Column(db.Float)
    latitude = db.Column(db.Float)
    altitude = db.Column(db.Float)
    ver_angle = db.Column(db.Float)
    hor_angle = db.Column(db.Float)
    raw_A = db.Column(db.BLOB)
    raw_B = db.Column(db.BLOB)

    def __repr__(self):
        return '<TaskData {}>'.format(self.task_id+' '+self.timestamp+' '+self.ver_angle+' '+self.hor_angle)
    
