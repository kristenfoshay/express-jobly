'use strict';

/** Routes for jobs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { checkForAdmin } = require('../middleware/auth');
const Job = require('../models/job');

const newJobSchema = require('../schemas/newJobSchema.json');
const updateJobSchema = require('../schemas/updateJobSchema.json');
const searchJobSchema = require('../schemas/searchJobSchema.json');

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle}
 *
 * Authorization required: admin
 */

router.post('/', checkForAdmin, async function(req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, newJobSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (case-insensitive, matches-any-part-of-string search)
 * - minimumSalary
 * - equityCheck (
 * if true, filter to jobs that provide a non-zero amount of equity. 
 * If false or not included in the filtering, list all jobs regardless of equity)
 *
 * Authorization required: none
 */

router.get('/', async function(req, res, next) {
    try {
        const q = req.query;
        if (q.minimumSalary !== undefined) q.minimumSalary = +q.minimumSalary;
        q.equityCheck = q.equityCheck === 'true';

        const validator = jsonschema.validate(q, searchJobSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const jobs = await Job.findAll(q);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companies }
 *   where companies is [{ handle, name, description, numEmployees, logoUrl }, ...]
 *
 * Authorization required: none
 */

router.get('/:id', async function(req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHanlde }
 *
 * Authorization required: admin
 */

router.patch('/:id', checkForAdmin, async function(req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, updateJobSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete('/:id', checkForAdmin, async function(req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;