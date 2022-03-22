const Helpers = require("nugttah-backend/helpers");
const Invoice = require("nugttah-backend/modules/invoices");
const DirectOrder = require("nugttah-backend/modules/direct.orders");
const Part = require("nugttah-backend/modules/parts");
const DirectOrderPart = require("nugttah-backend/modules/direct.order.parts");
const DirectOrderPartModel = require("../../models/direct-order-part.model");

/**
 * @description
 * Encapsulates common business functionalities related to {Invoice}.
 *
 * Method Arguments are hardcoded for now (:
 */
class InvoiceFacade {
  constructor({
    DirectOrderPartRepository,
    PartRepository,
    DirectOrderRepository,
    InvoiceRepository,
  }) {
    this.directOrderPartRepository = new DirectOrderPartRepository({
      DirectOrderPart,
    });
    this.partRepository = new PartRepository({ Part });
    this.directOrderRepository = new DirectOrderRepository({ DirectOrder });
    this.invoiceRepository = new InvoiceRepository({ Invoice });
  }

  groupDirectOrderParts() {
    return Helpers.groupBy(this.getDirectOrderParts(), "directOrderId");
  }

  async getDirectOrderParts() {
    const [directOrderParts, parts] = await Promise.all([
      this.DirectOrderPartRepository.getMany(
        {
          createdAt: { $gt: new Date("2021-04-01") },
          fulfillmentCompletedAt: { $exists: true },
          invoiceId: { $exists: false },
        },
        ["_id", "directOrderId", "partClass", "priceBeforeDiscount"]
      ),
      this.PartRepository.getMany(
        {
          directOrderId: { $exists: true },
          createdAt: { $gt: new Date("2021-04-01") },
          partClass: "requestPart",
          pricedAt: { $exists: true },
          invoiceId: { $exists: false },
        },
        ["_id", "directOrderId", "partClass", "premiumPriceBeforeDiscount"]
      ),
    ]);

    return directOrderParts.concat(parts);
  }

  /**
   *
   * @param {directOrderId}
   * @returns {DirectOrder}
   * @description
   * Gets a direct order related  to specific direct order parts.
   */
  async getDirectOrder(directOrderId) {
    return await this.DirectOrderRepository.getOne({ _id: directOrderId }, [
      "partsIds",
      "requestPartsIds",
      "discountAmount",
      "deliveryFees",
      "walletPaymentAmount",
    ]);
  }

  async createInvoice(input) {
    return await this.invoiceRepository.create(input);
  }

  async updateDirectOrder(query, input) {
    return await this.directOrderRepository.updateOne(query, input);
  }

  async updateDirectOrderPart(partId, createdInvoice) {
    return await this.directOrderPartRepository.updateOne(
      { _id: partId },
      { $addToSet: { invoicesIds: createdInvoice._id } }
    );
  }

  async updatePart(partId, createdInvoice) {
    return await this.partRepository.updateOne(
      { _id: partId },
      { invoiceId: createdInvoice._id }
    );
  }

  /**
   *
   * @param {directOrderId}
   * @returns {Invoice[]}
   * @description
   * Gets invoices related to a specific direct order.
   */
  async getRelatedInvoicesToDirectOrder(directOrderId) {
    return await this.InvoiceRepository.getMany({ _id: directOrderId }, [
      "walletPaymentAmount",
      "discountAmount",
      "deliveryFees",
    ]);
  }

  getDirectOrderPartsTotalAmount(directOrderParts) {
    return DirectOrderPartModel.calculateTotalAmount(directOrderParts);
  }
}

module.exports = InvoiceFacade;
