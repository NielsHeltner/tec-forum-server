#!/usr/bin/env node
var database = require('./database.js');
var url = require('url');

var listeners = [];


sendHeader = function(httpCode, response) {
    response.writeHead(httpCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'
    });
}

getUser = function(request, response) {
    var urlParts = url.parse(request.url, true);
    database.getUser(urlParts.query, function(userDTO) {
        response.end(JSON.stringify(userDTO));
    });
}

getThread = function(request, response) {
    var urlParts = url.parse(request.url, true);
    database.getThread(urlParts.query, function(threadDTO) {
        response.end(JSON.stringify(threadDTO));
    });
}
getThreadComments = function(request, response) {
    var urlParts = url.parse(request.url, true);
    database.getThreadComments(urlParts.query, function(commentsDTO) {
        response.end(JSON.stringify(commentsDTO));          
    });
}

getThreadCommentsPoll = function(request, response) {
    listeners.push({response: response, request: request});
    console.log('add listener, listener lenght: '+listeners.length);
}

putComment = function(request, response) {
    request.on('data', function(data) {
        console.log(JSON.parse(data));
        database.saveComment(data, function() {
            sendThreadCommentsResponse();
            console.log("Comment received, all listeners updated!");
        });
    });
    
}

sendThreadCommentsResponse = function() {
    listeners.forEach(function(listenerElement) {
        var urlParts = url.parse(listenerElement.request.url, true);
        database.getThreadComments(urlParts.query, function(commentsDTO) {
            listenerElement.response.end(JSON.stringify(commentsDTO)); 
            var index = listeners.indexOf(listenerElement);
            listeners.splice(index, 1);
            console.log('index of listener: '+index);         
        });
    }); 

    //console.log(listeners.length);
}

getCategories = function(request, response) {
    database.getCategories(function(categoriesDTO) {
        response.end(JSON.stringify(categoriesDTO));
    });
}

getThreadsInCategory = function(request, response) {
    var urlParts = url.parse(request.url, true);
    database.getThreadsInCategory(urlParts.query, function(threadsDTO) {
        response.end(JSON.stringify(threadsDTO));
    });
}

getUserThreads = function(request, response) {
    var urlParts = url.parse(request.url, true);
    database.getUserThreads(urlParts.query, function(threadsDTO) {
        response.end(JSON.stringify(threadsDTO));
    });
}

putUser = function(request, response) { //create
    request.on('data', function(data) {
        console.log('Received user creation request for: ' + data);
        database.saveUser(data, function(saveUserDTO) {
            console.log(saveUserDTO);
            response.end(JSON.stringify(saveUserDTO));
        });
    });
}

postUser = function(request, response) { //login
    request.on('data', function(data) {
        console.log('Received login request for: ' + data);
        database.logIn(data, function(logInDTO) {
            console.log(logInDTO);
            response.end(JSON.stringify(logInDTO));
        });
    })
}

handler_delete = function(request, response) {
    /*request.on('data', function(data) {
        deleteFromArray(data);
        sendHeader(response);
        response.end(JSON.stringify(4));
    });*/
}

sendOptions = function(request, response) {
    //sendHeader(response);
    response.end(null);
}

routes = {
    'GET/users': getUser,
    'GET/thread': getThread,
    'GET/thread/comments': getThreadComments,
    'GET/thread/commentsPoll': getThreadCommentsPoll,
    'PUT/thread/submitComment': putComment,
    'GET/categories': getCategories,
    'GET/categories/threads': getThreadsInCategory,
    'GET/users/threads': getUserThreads,
    'PUT/users': putUser,
    'POST/users': postUser,
    'DELETE': handler_delete,
    'OPTIONS': sendOptions
}

module.exports = {

    handleRequest: function(request, response) {
        var urlParts = url.parse(request.url, true);
        var routedRequest = request['method'] + urlParts.pathname;
        if (request['method'] == 'OPTIONS') {
            routedRequest = request['method'];
        }
        if (routes[routedRequest]) {
            sendHeader(200, response); // burde kun være nødvendigt at sende headeren her
            routes[routedRequest](request, response);
        } else {
            console.log('Could not find method ' + routedRequest);
            sendHeader(404, response);
            response.end(null); // egentligt burde statussen fra senderHeader sættes til 404 i stedet for 200 her
        }
    }
}