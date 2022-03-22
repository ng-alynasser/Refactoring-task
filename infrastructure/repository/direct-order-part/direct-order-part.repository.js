/**
 * @description
 * Encapsulates common db operations related to {DirectOrderPart}.
 */
class DirectOrderPartRepository {
  constructor({ DirectOrderPartModel }) {
    this.DirectOrderPartModel = DirectOrderPartModel;
  }

  async getMany(query, include) {
    return this.DirectOrderPartModel.find(query).select(include.join(" "));
  }

  async updateOne(query, input) {
    return this.DirectOrderPartModel.updateOne(query, input);
  }
}

module.exports = DirectOrderPartRepository;
