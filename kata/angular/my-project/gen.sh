# Create the simplest possible scaffold for an Angular app after initial `ng new my-project`
# For timing, `npm install -g gnomon` and then pipe to gnomon like `./gen.sh | gnomon`

# Global components
ng g c home -s -t --flat --skip-tests
ng g c navbar -s -t --flat --skip-tests

# Create a todos module with components
ng g m todos
ng g c todos/todos -m todos -s -t --flat --skip-tests
ng g c todos/todo-add -m todos -s -t --flat --skip-tests
ng g c todos/todo-edit -m todos -s -t --flat --skip-tests
