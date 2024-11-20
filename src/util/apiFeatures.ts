export class APIFeatures {
  mongooseQuery: any
  queryString: any

  constructor(mongooseQuery: any, queryString: any) {
    this.mongooseQuery = mongooseQuery
    this.queryString = queryString
  }

  filter() {
    const queryObj = { ...this.queryString }
    const excludedFields = ['page', 'sort', 'limit', 'fields']
    excludedFields.forEach((el) => delete queryObj[el])

    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)
    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr))
    return this
  }

  sorting() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ')
      this.mongooseQuery = this.mongooseQuery.sort(sortBy)
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt')
    }
    return this
  }

  limit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ')

      this.mongooseQuery = this.mongooseQuery.select(fields)
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v')
    }

    return this
  }

  pagination() {
    const page = this.queryString.page * 1 || 1
    const limit = this.queryString.limit * 1 || 100

    const skip = (page - 1) * limit
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit)
    return this
  }
}
