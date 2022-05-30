const { BadRequestError } = require("../expressError");



function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError("No data");

    // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
    const cols = keys.map((colName, idx) =>
        `"${jsToSql[colName] || colName}"=$${idx + 1}`,
    );

    return {
        setCols: cols.join(", "),
        values: Object.values(dataToUpdate),
    };
}

function sqlQuerySearch(query) {
    const { minEmployees, maxEmployees, name } = query;

    if (minEmployees > maxEmployees) {
        throw new BadRequestError('Min employees must be greater than max employees');
    }
    let queryValues = [];
    let sql = [];

    if (minEmployees !== undefined) {
        queryValues.push(minEmployees);
        sql.push(`num_employees >= $${queryValues.length}`);
    }
    if (maxEmployees !== undefined) {
        queryValues.push(maxEmployees);
        sql.push(`num_employees <= $${queryValues.length}`);
    }
    if (name) {
        queryValues.push(`%${name}%`);
        sql.push(`name ILIKE $${queryValues.length}`);
    }

    return {
        whereCols: sql.join(' AND '),
        values: queryValues
    };
}

function sqlJobQuerySearch(query = {}) {
    const { minimumSalary, equityCheck, title } = query;

    let queryValues = [];
    let sql = [];

    if (minimumSalary !== undefined) {
        queryValues.push(minimumSalary);
        sql.push(`salary >= $${queryValues.length}`);
    }
    if (equityCheck === true) {
        sql.push(`equity > 0`);
    }
    if (title) {
        queryValues.push(`%${title}%`);
        sql.push(`title ILIKE $${queryValues.length}`);
    }

    return {
        whereCols: sql.join(' AND '),
        values: queryValues
    };
}

module.exports = { sqlForPartialUpdate, sqlQuerySearch, sqlJobQuerySearch };