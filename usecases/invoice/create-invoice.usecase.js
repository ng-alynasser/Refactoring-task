const DirectOrderRepository = require("../../infrastructure/repository/direct-order/direct-order.repository");
const DirectOrderPartRepository = require("../../infrastructure/repository/direct-order-part/direct-order-part.repository");
const InvoiceRepository = require("../../infrastructure/repository/invoice/invoice.repository");
const PartRepository = require("../../infrastructure/repository/part/part.repository");

/**
 * @description
 * Representing the business logic behind creating invoices.
 */
class CreateInvoiceUseCase {
  constructor({ InvoiceFacade }) {
    this.invoiceFacade = new InvoiceFacade({
      DirectOrderPartRepository,
      PartRepository,
      DirectOrderRepository,
      InvoiceRepository,
    });
  }

  async execute() {
    const directOrderPartsGroups = this.invoiceFacade.groupDirectOrderParts();

    try {
      const invoiceIds = await Promise.all(
        directOrderPartsGroups.map(async (directOrderPartGroup) => {
          const { directOrderId } = directOrderPartGroup[0];

          /**
           * Firstly, we're getting the direct order and the related invoices attached to
           * it if there's any.
           */
          const [directOrder, relatedInvoices] = await Promise.all([
            this.invoiceFacade.getDirectOrder(directOrderId),
            this.invoiceFacade.getRelatedInvoicesToDirectOrder(directOrderId),
          ]);

          /**
           * Secondly, we're getting the total amount of the parts of that direct order.
           */
          const partsTotalAmount =
            this.invoiceFacade.getDirectOrderPartsTotalAmount(
              directOrderPartGroup
            );

          /**
           * Thirdly, we're calculating the total amount of the invoice.
           */
          const invoiceTotalAmount = this.calculateInvoiceTotalAmount(
            directOrder,
            relatedInvoices,
            partsTotalAmount
          );

          /**
           * Throwing an error if the total amount of the invoice is less than zero.
           */
          if (invoiceTotalAmount < 0) {
            throw Error(
              `Could not create invoice for directOrder: ${directOrder._id} with totalAmount: ${totalAmount}. `
            );
          }

          /**
           * Fourthly, we're creating the invoice entity.
           */
          const createdInvoice = this.populateInvoice(
            directOrder,
            directOrderPartGroup
          );

          /**
           * Finally, we're updating the effected entities with the new invoice
           * (DirectOrderPart, and Part entities).
           */
          this.updateAffectedDirectOrder(directOrder, createdInvoice);

          this.updateAffectedStockAndQuotaParts(
            directOrderPartGroup,
            createdInvoice
          );

          return createdInvoice._id;
        })
      );

      return {
        case: 1,
        message: "Invoices have been created successfully",
        invoiceIds,
      };
    } catch (err) {
      Helpers.reportError(err);
    }
  }

  populateInvoice(directOrder, directOrderPartGroup) {
    return this.invoiceFacade.createInvoice({
      directOrderId: directOrder._id,
      directOrderPartsIds:
        DirectOrderPartModel.extractStockAndQuotaPartsIds(directOrderPartGroup),
      requestPartsIds:
        DirectOrderPartModel.extractRequestedPartsIds(directOrderPartGroup),
      totalPartsAmount: partsTotalAmount,
      totalAmount: invoiceTotalAmount,
      deliveryFees: directOrder.deliveryFees,
      walletPaymentAmount: directOrder.walletPaymentAmount,
      discountAmount: directOrder.discountAmount,
    });
  }

  async updateAffectedStockAndQuotaParts(directOrderPartGroup, createdInvoice) {
    return await Promise.all(
      DirectOrderPartModel.extractStockAndQuotaPartsIds(
        directOrderPartGroup
      ).map(
        async (partId) =>
          await this.invoiceFacade.updateDirectOrderPart(partId, createdInvoice)
      )
    );
  }

  async updateAffectedRequestedParts(directOrderPartGroup, createdInvoice) {
    return await Promise.all(
      DirectOrderPartModel.extractRequestedPartsIds(directOrderPartGroup).map(
        async (partId) =>
          await this.invoiceFacade.updatePart(partId, createdInvoice)
      )
    );
  }

  calculateInvoiceTotalAmount(directOrder, relatedInvoices, partsTotalAmount) {
    /**
     * Initializing the invoice amount with the parts amount.
     */
    let invoiceTotalAmount = partsTotalAmount;

    /**
     * In case there's no related invoices, delivery fees are added.
     */
    if (directOrder.deliveryFees && !relatedInvoices.length) {
      invoiceTotalAmount = +directOrder.deliveryFees;
    }

    /**
     * In case there's a wallet payment amount, we need to subtract adjusted
     * wallet payment amount from the invoice total amount.
     */
    if (directOrder.walletPaymentAmount) {
      invoiceTotalAmount -= this.adjustWalletPaymentAmount(
        relatedInvoices,
        directOrder,
        invoiceTotalAmount
      );
    }

    /**
     * In case there's a wallet payment amount, we need to subtract adjusted
     * discount amount from the invoice total amount.
     */
    if (directOrder.discountAmount) {
      invoiceTotalAmount -= this.adjustDiscountAmount(
        relatedInvoices,
        directOrder,
        invoiceTotalAmount
      );
    }
  }

  adjustWalletPaymentAmount(invoices, directOrder, invoiceTotalAmount) {
    let adjustedWalletPaymentAmount;

    invoices.forEach((invoice) => {
      adjustedWalletPaymentAmount = Math.min(
        0,
        directOrder.walletPaymentAmount - invoice.walletPaymentAmount
      );
    });

    return Math.min(adjustedWalletPaymentAmount, invoiceTotalAmount);
  }

  adjustDiscountAmount(invoices, directOrder, invoiceTotalAmount) {
    let adjustedDiscountAmount;

    invoices.forEach((invoice) => {
      adjustedDiscountAmount = Math.min(
        directOrder.discountAmount,
        invoice.discountAmount
      );
    });

    return Math.min(adjustedDiscountAmount, invoiceTotalAmount);
  }
}

module.exports = CreateInvoiceUseCase;
