const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');

var todos = {
    1: {title: 'build an API', order: 1, completed: false},
    2: {title: '?????', order: 2, completed: false},
    3: {title: 'profit!', order: 3, completed: false}
};
var nextId = 4;

var todoResourceSchema = Joi.object({
    title: Joi.string(),
    completed: Joi.boolean(),
    order: Joi.number().integer(),
    url: Joi.string()
});

var todoIdSchema = Joi.number().integer().positive()
    .required().description('The Todo ID');

var getTodo = function (id) {
    if( !(id in todos)) { return false; }
    var result = {
        title: todos[id].title,
        completed: todos[id].completed,
        order: todos[id].order,
        url: server.info.uri + '/todos/' + id
    }
    return result;
};

const server = new Hapi.Server();
server.connection({
    host: '127.0.0.1',
    port: 5000,
    routes: {cors: true}
});

const swaggerOptions = {
    info: {
        'title': 'Todo API',
        'version': '1.0',
        'description': 'A simple TODO API',
    },
    documentationPath: '/doc',
    tags: [
        {
            description: 'TODO operations',
            name: 'todos'
        }
    ]
}

server.register([
    Inert,
    Vision,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }
]);

server.route({
    method: 'GET',
    path: '/todos/',
    handler: function (request, reply) {
        var result = [];
        for(var key in todos) {
            result.push(getTodo(key));
        }
        reply(result).code(200);
    },
    config: {
        tags: ['api'],
        description: 'List all todos',
        plugins: {'hapi-swagger': {responses: {
            200: {
                description: 'Success',
                schema: Joi.array().items(
                    todoResourceSchema.label('Result')
                )
            }
        }}}
    }
});

server.route({
    method: 'DELETE',
    path: '/todos/',
    handler: function (request, reply) {
        todos = {};
        reply();
    },
    config: {
        tags: ['api'],
        description: 'Delete all todos',
        plugins: {'hapi-swagger': {responses: {
            204: {description: 'Todos deleted'}
        }}}
    }
});

server.route({
    method: 'POST',
    path: '/todos/',
    handler: function (request, reply) {
        todos[nextId] = {
            title: request.payload.title,
            order: request.payload.order || 0,
            completed: request.payload.completed || false
        }
        nextId++;
        reply(getTodo(nextId - 1)).code(201);
    },
    config: {
        tags: ['api'],
        description: 'Create a todo',
        validate: {
            payload: {
                title: Joi.string().required(),
                order: Joi.number().integer(),
                completed: Joi.boolean()
            }
        },
        plugins: {'hapi-swagger': {responses: {
            201: {
                description: 'Created',
                schema: todoResourceSchema.label('Result')
            }
        }}}
    }
});

server.route({
    method: 'GET',
    path: '/todos/{todo_id}',
    handler: function (request, reply) {
        response = getTodo(request.params.todo_id);
        if (response === false){
            reply().code(404);
        } else {
            reply(response).code(200);
        }
    },
    config: {
        tags: ['api'],
        description: 'Fetch a given todo',
        validate: {
            params: {
                todo_id: todoIdSchema
            }
        },
        plugins: {'hapi-swagger': {responses: {
            200: {
                description: 'Success',
                schema: todoResourceSchema.label('Result')
            },
            404: {description: 'Todo not found'}
        }}}
    }
});

server.route({
    method: 'PATCH',
    path: '/todos/{todo_id}',
    handler: function (request, reply) {
        todoId = request.params.todo_id;
        if (! (todoId in todos)) {
            reply().code(404);
        } else {
            for (var attrName in request.payload) {
                todos[todoId][attrName] = request.payload[attrName];
            }
            reply(getTodo(todoId)).code(200);
        }
    },
    config: {
        tags: ['api'],
        description: 'Update a given todo',
        validate: {
            params: {
                todo_id: todoIdSchema
            },
            payload: {
                title: Joi.string(),
                completed: Joi.boolean(),
                order: Joi.number()
            }
        },
        plugins: {'hapi-swagger': {responses: {
            200: {
                description: 'Success',
                schema: todoResourceSchema.label('Result')
            },
            404: {description: 'Todo not found'}
        }}}
    }
});

server.route({
    method: 'DELETE',
    path: '/todos/{todo_id}',
    handler: function (request, reply) {
        if( !(request.params.todo_id in todos)) {
            reply('Todo Not Found').code(404);
            return;
        }
        delete todos[request.params.todo_id];
        reply().code(204);
    },
    config: {
        tags: ['api'],
        description: 'Delete a given todo',
        validate: {
            params: {
                todo_id: todoIdSchema
            }
        },
        plugins: {'hapi-swagger': {responses: {
            204: {description: 'Todo deleted'},
            404: {description: 'Todo not found'}
        }}}
    }
});

server.start((err) => {
    console.log('Server running at:', server.info.uri);
});
