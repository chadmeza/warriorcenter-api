const Sermon = require('../models/sermon');
const fs = require('fs');
const util = require('util');

exports.getSermons = async (req, res, next) => {
    try {
        const sermons = await Sermon.find({}).sort({ date: 'desc' });

        res.status(200).json({
            sermons: sermons
        });
    } catch(error) {
        next(error);
    }
};

exports.getLimitedSermons = async (req, res, next) => {
    try {
        let queryLimit; 
        
        queryLimit = parseInt(req.params.number);

        if (isNaN(queryLimit)) {
            queryLimit = 3;
        }

        const sermons = await Sermon.find({}, null, { limit: queryLimit, sort: { date: 'desc' } });
        
        res.status(200).json({
            sermons: sermons
        });
    } catch(error) {
        next(error);
    }
};

exports.getSermon = async (req, res, next) => {
    try {
        const sermon = await Sermon.findById(req.params.id);

        if (sermon) {
            res.status(200).json({
                sermon: sermon
            });
        } else {
            res.status(404).json({ 
                error: 'Invalid sermon ID.' 
            });
        }
    } catch(error) {
        next(error);
    }
};

exports.createSermon = async (req, res, next) => {
    let sermons;
    
    try {
        const url = req.protocol + "://" + req.get("host");
        const sermon = new Sermon({
            title: req.body.title,
            scripture: req.body.scripture,
            speaker: req.body.speaker,
            date: req.body.date,
            mp3: url + "/mp3/" + req.file.filename
        });

        sermons = await Sermon.find();

        if (sermons && sermons.length > 9) {
            return res.status(400).json({
                error: 'You have reached your limit for sermons. Your account only allows 10 sermons at a time.'
            });
        }

        const newSermon = await Sermon.create(sermon);

        res.status(201).json({
            sermon: newSermon,
            id: newSermon._id
        });
    } catch(error) {
        next(error);
    }
};
  
exports.updateSermon = async (req, res, next) => {
    try {
        const sermon = new Sermon({
            _id: req.body.id,
            title: req.body.title,
            scripture: req.body.scripture,
            speaker: req.body.speaker,
            date: req.body.date,
            mp3: req.body.mp3
        });

        const result = await Sermon.findByIdAndUpdate(req.params.id, sermon, { new: true });

        if (!result) {
            return res.status(404).json({ 
                error: 'Could not find a sermon with ID of ' + req.params.id 
            });
        }

        res.status(200).json({ 
            sermon: result 
        });
    } catch(error) {
        next(error);
    }
};
  
exports.deleteSermon = async (req, res, next) => {
    try {
        const sermon = await Sermon.findById(req.params.id);

        if (!sermon) {
            return res.status(404).json({ 
                error: 'Could not find a sermon with ID of ' + req.params.id
            });
        }

        const parsedMP3Path = sermon.mp3.split('/');
        const pathToDelete = parsedMP3Path[parsedMP3Path.length - 2] + '/' + parsedMP3Path[parsedMP3Path.length - 1];

        const accessAsync = util.promisify(fs.access);
        const unlinkAsync = util.promisify(fs.unlink);

        await accessAsync(pathToDelete, fs.F_OK);
        await unlinkAsync(pathToDelete);

        const result = await Sermon.deleteOne({ _id: req.params.id });

        res.status(200).json({ 
            sermon: result
        });
    } catch(error) {
        next(error);
    }
};