from werkzeug.security import generate_password_hash
with open("password.pwd",'r') as load_f:
    password = load_f.read()+'crazyandy'
    with open("license.lic","w") as f:
        f.write(generate_password_hash(password))
