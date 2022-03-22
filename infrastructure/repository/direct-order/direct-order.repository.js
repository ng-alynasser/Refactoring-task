/**
 * @description
 * Encapsulates common db operations related to {DirectOrder}.
 */
class DirectOrderRepository {
  constructor({ DirectOrderModel }) {
    this.DirectOrderModel = DirectOrderModel;
  }

  getOne(query, include) {
    return this.DirectOrderModel.find(query).select(include.join(" "));
  }

  updateOne(query, input) {
    return this.DirectOrderModel.update(query, input);
  }
}

module.exports = DirectOrderRepository;
