/**
 * @description
 * TODO:
 * This should be an extension for {DirectOrderPartModel} containing common
 * domain functionalities related to the model.
 */
class DirectOrderPartModel {
  /**
   *
   * @param {DirectOrderPart[]}
   * @returns {TotalAmount}
   * @description
   * Calculates the total of Stock/Quota & Requested parts per each.
   */
  static calculateTotalAmount(directOrderParts) {
    const totalPriceOfStockAndQuotaParts =
      this.calculateStockAndQuotaPartsTotalAmount(directOrderParts);
    const totalPriceOfRequestedParts =
      this.calculateRequestedPartsTotalAmount(directOrderParts);

    return Helpers.Numbers.toFixedNumber(
      totalPriceOfStockAndQuotaParts + totalPriceOfRequestedParts
    );
  }

  static calculateStockAndQuotaPartsTotalAmount(directOrderParts) {
    const stockAndQuotaParts = this.getStockAndQuotaParts(directOrderParts);

    return stockAndQuotaParts.reduce(
      (sum, part) => sum + part.priceBeforeDiscount,
      0
    );
  }

  static calculateRequestedPartsTotalAmount(directOrderParts) {
    const requestedParts = this.getRequestedParts(directOrderParts);

    return requestedParts.reduce(
      (sum, part) => sum + part.premiumPriceBeforeDiscount,
      0
    );
  }

  static getStockAndQuotaParts(directOrderParts) {
    return directOrderParts.filter(
      (directOrderPart) =>
        directOrderPart.partClass === "StockPart" ||
        directOrderPart.partClass === "QuotaPart"
    );
  }

  static getRequestedParts(directOrderParts) {
    return directOrderParts.filter(
      (directOrderPart) => directOrderPart.partClass === "requestPart"
    );
  }

  static extractStockAndQuotaPartsIds(directOrderParts) {
    return this.getStockAndQuotaParts(directOrderParts).map(
      (directOrderPart) => directOrderPart._id
    );
  }

  static extractRequestedPartsIds(directOrderParts) {
    return this.getRequestedParts(directOrderParts).map(
      (directOrderPart) => directOrderPart._id
    );
  }
}
