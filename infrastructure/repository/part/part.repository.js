/**
 * @description
 * Encapsulates common db operations related to {DirectOrderPart}.
 */
class PartRepository {
  constructor({ PartModel }) {
    this.PartModel = PartModel;
  }

  getMany(query, include) {
    return this.PartModel.find(query).select(include.join(" "));
  }
}

module.exports = PartRepository;
