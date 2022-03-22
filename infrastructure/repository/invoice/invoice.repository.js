/**
 * @description
 * Encapsulates common db operations related to {Invoice}.
 */

class InvoiceRepository {
  constructor({ InvoiceModel }) {
    this.invoiceModel = InvoiceModel;
  }

  async getMany(query, include) {
    return this.invoiceModel.find(query).select(include.join([" "]));
  }

  async createOne(input) {
    return this.invoiceModel.create(input);
  }
}
