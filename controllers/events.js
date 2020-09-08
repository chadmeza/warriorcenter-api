const Event = require('../models/event');

exports.getEvents = async (req, res, next) => {
    try {
        const events = await Event.find().sort({ date: 'asc' });

        res.status(200).json({
            events: events
        });
    } catch(error) {
        res.status(500).json({
            error: 'Could not find any events.'
        });
    }
};

exports.getLimitedEvents = async (req, res, next) => {
    try {
        let queryLimit;

        queryLimit = parseInt(req.params.number);     

        if (isNaN(queryLimit)) {
            queryLimit = 3;
        }
        
        const events = await Event.find({date: { $gt: Date.now() }}, null, { limit: queryLimit, sort: { date: 'asc' } });
        
        res.status(200).json({
            events: events
        });
    } catch(error) {
        res.status(500).json({
            error: 'Could not find any events.'
        });
    }
};

exports.getEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (event) {
            res.status(200).json({
                event: event
            });
        } else {
            res.status(404).json({ 
                error: 'Invalid event ID.' 
            });
        }
    } catch(error) {
        res.status(500).json({
            error: 'Could not find this event.'
        });
    }
};

exports.createEvent = async (req, res, next) => {
    try {
        const event = await Event.create({
            name: req.body.name,
            details: req.body.details,
            address: req.body.address,
            date: req.body.date,
            time: req.body.time
        });

        res.status(201).json({
            event: event,
            id: event._id
        });
    } catch(error) {
        res.status(500).json({
            error: 'Could not create a new event.'
        });
    }
};
  
exports.updateEvent = async (req, res, next) => {
    try {
        const event = new Event({
            _id: req.body.id,
            name: req.body.name,
            details: req.body.details,
            address: req.body.address,
            date: req.body.date,
            time: req.body.time
        });

        const result = await Event.findByIdAndUpdate(req.params.id, event, { new: true });

        if (!result) {
            return res.status(404).json({ 
                error: "Could not find an event with ID of " + req.params.id 
            });
        }

        res.status(200).json({
            event: result
        });
    } catch(error) {
        res.status(500).json({
            error: 'Could not update this event.'
        });
    }
};
  
exports.deleteEvent = async (req, res, next) => {
    try {
        const result = await Event.deleteOne({ _id: req.params.id });

        res.status(200).json({ 
            result: result
        });
    } catch(error) {
        res.status(500).json({
            error: 'Could not delete this event.'
        });
    }
};

exports.deleteOldEvents = async (req, res, next) => {
    try {
        const result = await Event.deleteMany({ date: { $lte: Date.now() } });

        res.status(200).json({ 
            result: result
        });
    } catch(error) {
        res.status(500).json({
            error: 'Could not delete events.'
        });
    }
};