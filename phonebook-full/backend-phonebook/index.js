require('dotenv').config()
const express = require('express')
const {request} = require("express");
const app = express()
const morgan = require('morgan');
const Person = require('./models/person')

morgan.token('personDetails', function (req, res) {

    if (req.method === 'POST' && req.originalUrl === '/api/persons') {
        const name = req.body.name || '-';
        const number = req.body.number || '-';
        return `Name: ${name}, Number: ${number}`;
    }
    return '';
});


let persons = []

app.use(express.static('dist'))


const cors = require('cors')

app.use(cors())
app.use(express.json())
app.use(morgan('tiny'))

const generateId = () => {
    if (persons.length === 0) {
        return "1"; // Start IDs from "1" if the list is empty
    }
    const maxId = persons.reduce((max, person) => Math.max(max, Number(person.id)), 0);
    return String(maxId + 1);
}


app.get('/', (request, response) => {
    response.send('<h1>started</h1>')
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(people => {
        response.json(people)
    })
})

app.get('/info', (request, response) => {
    response.send('<p>Phonebook has info for ' + persons.length + ' people </p>' + new Date().toTimeString())
})

app.get('/api/persons/:id', (request, response, next) => {
    Note.findById(request.params.id).then(person => {
        if (person) {
            response.json(person)
        } else {
            response.status(404).end()
        }
    })
        .catch(error => next(error))
})


app.use(morgan(':personDetails'));
app.post('/api/persons', (request, response) => {
    const body = request.body


    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'content missing'
        })
    }


    const person = new Person ({
        name: body.name,
        number: body.number
    })



    person.save().then(saved => {
        response.json(saved)
    })


})


app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const person = {
        name: body.name,
        number: body.number
    }

    Person.findByIdAndUpdate(request.params.id, person, {new: true})
        .then(updated => {
            response.json(updated)
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({error: 'malformatted id'})
    }

    next(error)
}

app.use(errorHandler)



const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

