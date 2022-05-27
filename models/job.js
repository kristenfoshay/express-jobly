'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate, sqlJobQuerySearch } = require('../helpers/sql');

/** Related functions for companies. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws BadRequestError if job already in database.
     * */

    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`, [title, salary, equity, companyHandle]
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all companies.
     *
     * Returns [{ id, title, salary, equity, companyHandle }, ...]
     * */

    static async findAll(query = {}) {
        let querySql = `SELECT id,
                            title,
                            salary,
                            equity,
                            company_handle AS "companyHandle"
                        FROM jobs`;

        const { whereCols, values } = sqlJobQuerySearch(query);

        if (whereCols) querySql += ` WHERE ${whereCols}`;
        querySql += ' ORDER BY title';

        const jobsRes = await db.query(querySql, values);

        return jobsRes.rows;
    }

    /** Given a job id, return data about a job.
     *
     * Returns { id, title, salary, equity, companies }
     *   where companies is [{ handle, name, description, numEmployees, logoUrl }, ...]
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobResults = await db.query(
            `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]
        );

        const job = jobResults.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesResults = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             WHERE handle = $1`, [job.companyHandle]
        );

        delete job.companyHandle;
        job.company = companiesResults.rows[0];

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {
            companyHandle: 'company_handle'
        });
        const idVarIdx = '$' + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given company from database; returns undefined.
     *
     * Throws NotFoundError if company not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]
        );
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;