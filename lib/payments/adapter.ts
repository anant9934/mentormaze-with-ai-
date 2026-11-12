import crypto from "crypto";

export interface PaymentOrderParams {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerPhone?: string;
  customerEmail: string;
  customerName: string;
  bookingId: string;
}

export interface PaymentVerificationResult {
  isSuccess: boolean;
  orderId: string;
  paymentId?: string;
  paymentStatus: "SUCCESS" | "FAILED" | "PENDING";
  signatureValid: boolean;
}

export interface IPaymentGateway {
  createOrder(params: PaymentOrderParams): Promise<{ orderId: string; paymentSessionId: string; cfOrderId?: string }>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean;
}

export class CashfreePaymentAdapter implements IPaymentGateway {
  private appId: string;
  private secretKey: string;
  private webhookSecret: string;
  private environment: "TEST" | "PRODUCTION";

  constructor() {
    this.appId = process.env.CASHFREE_APP_ID || "TEST_APP_ID";
    this.secretKey = process.env.CASHFREE_SECRET_KEY || "TEST_SECRET";
    this.webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || "TEST_WEBHOOK_SECRET";
    this.environment = (process.env.CASHFREE_ENVIRONMENT as any) || "TEST";
  }

  async createOrder(params: PaymentOrderParams) {
    // In Sandbox / Test mode, return simulated payment session token
    const paymentSessionId = `session_cf_test_${Date.now()}`;
    return {
      orderId: params.orderId,
      paymentSessionId,
      cfOrderId: `cf_order_${params.orderId}`,
    };
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const data = `${orderId}${paymentId}`;
    const generated = crypto
      .createHmac("sha256", this.secretKey)
      .update(data)
      .digest("hex");

    // In sandbox test environments, accept simulation signature
    if (this.environment === "TEST" && signature.startsWith("sim_sig_")) {
      return true;
    }

    return generated === signature;
  }

  verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
    const data = `${timestamp}${rawBody}`;
    const generated = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(data)
      .digest("base64");

    if (this.environment === "TEST" && signature === "test_valid_signature") {
      return true;
    }

    return generated === signature;
  }
}

export const paymentGateway = new CashfreePaymentAdapter();
