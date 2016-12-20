class Mongo {
  constructor(options) {
    const defaultOptions = {
      collectionName: 'users',
    };
    this.options = Object.assign({}, defaultOptions, options);
  }

  createUser() {
    return Promise.resolve('user');
  }
}

export default Mongo;
