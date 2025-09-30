const paypal = require("@paypal/checkout-server-sdk");
const Order = require("../models/Order");

// PayPal client configuration (assumed to be set up in a config file or environment)
const environment = new paypal.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

// TAC-based pricing rules (abbreviated)
const tacPricing = {
  "86720604": { // Huawei H112-370
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86073004": { // Huawei H112-372
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86193505": { // Huawei H122-373-A
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86688704": { // Huawei H122-373
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 50,
    Other: 50,
  },
  "86406705": { // Huawei N5368X
    STC: 55,
    ZAIN: 55,
    MOBILY: 55,
    "GO Telecom": 55,
    Other: 55,
  },
  "86597804": { // Huawei E6878-370
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86037604": { // Huawei E6878-870
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86584007": { // Brovi H153-381
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86124107": { // Brovi H151-370
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86075606": { // Brovi H155-381
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86681507": { // Brovi H155-381 (TAC2)
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86688806": { // Brovi H155-382
    STC: 54,
    ZAIN: 32,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86241607": { // Brovi H155-383
    STC: 54,
    ZAIN: 32,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86717306": { // Brovi H158-381
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86120006": { // Brovi H352-381
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86968607": { // Brovi E6888-982
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86119206": { // Brovi Plus H155-380
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86015506": { // ZTE MU5120
    STC: 30,
    ZAIN: 25,
    MOBILY: 25,
    "GO Telecom": 25,
    Other: 25,
  },
  "86581106": { // ZTE MC888
    STC: 25,
    ZAIN: 25,
    MOBILY: 25,
    "GO Telecom": 25,
    Other: 25,
  },
  "86367104": { // ZTE MC801A
    STC: 23,
    ZAIN: 23,
    MOBILY: 23,
    "GO Telecom": 23,
    Other: 23,
  },
  "86556005": { // ZTE MC801A (TAC2)
    STC: 23,
    ZAIN: 23,
    MOBILY: 23,
    "GO Telecom": 23,
    Other: 23,
  },
  "86896605": { // ZTE MC801A (TAC3)
    STC: 23,
    ZAIN: 23,
    MOBILY: 23,
    "GO Telecom": 23,
    Other: 23,
  },
  "86156906": { // ZTE MC888A ULTRA
    STC: 25,
    ZAIN: 25,
    MOBILY: 25,
    "GO Telecom": 25,
    Other: 25,
  },
  "86992605": { // ZTE MU5001M
    STC: 25,
    ZAIN: 25,
    MOBILY: 25,
    "GO Telecom": 25,
    Other: 25,
  },
  "86637807": { // ZTE G5C
    STC: 25,
    ZAIN: 25,
    MOBILY: 25,
    "GO Telecom": 25,
    Other: 25,
  },
  "86062806": { // ZTE MC801A1
    STC: 23,
    ZAIN: 23,
    MOBILY: 23,
    "GO Telecom": 23,
    Other: 23,
  },
  "86160006": { // ZTE MC801A1 (TAC2)
    STC: 23,
    ZAIN: 23,
    MOBILY: 23,
    "GO Telecom": 23,
    Other: 23,
  },
  "86583105": { // Oppo T1A (CTC03)
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86264406": { // Oppo T1A (CTC03) (TAC2)
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86782206": { // Oppo T2 (CTD05)
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
 
 "86481205": { // GHTelcom H138-380
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86588106": { // Soyealink SRT873
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "86399806": { // Soyealink SRT875
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "35840799": { // GreenPacket D5H-250MK
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "35162435": { // GreenPacket D5H-EA20/EA60/EA62
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "35759615": { // GreenPacket Y5-210MU
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
  "35181075": { // AVXAV WQRTM-838A
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
  },
"86055606": { // AURORA C082 PRO
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
 },
 "35813213": { // D-Link DWR-2000M
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86886605": { // FIBOCOM AX3600
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86962406": { // TD TECH IC5980
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86204005": { // OPPO T1A (CTC02)
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"35418669": { // NOKIA AOD311NK
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86719705": { // QUECTEL RM500Q-AE
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86133507": { // BROVI H165-383
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86490205": { // OPPO T1A (CTB06)
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86172305": { // OPPO T1A (CTB03)
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86851005": { // MEIGLINK A50E
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"35705623": { // NOKIA FASTMILE 5G GATEWAY 3.2
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"35277834": { // NOKIA FASTMILE 5G GATEWAY 3.1
    STC: 54,
    ZAIN: 28,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86144007": { // QUECTEL RG50OL-EU
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86441004": { // ZLT X21
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86529706": { // ZTE MU5001A-B-M-U/MU5002
    STC: 24,
    ZAIN: 24,
    MOBILY: 24,
    "GO Telecom": 24,
    Other: 24,
},
"86911905": { // TELSTRA AW1000
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86237606": { // Flybox CP52
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"35041894": { // TP-Link Archer NX200
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86500606": { // Deco Deco X50-5G
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86920106": { // Soyealink SRT873HS
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"35041746": { // Flybox 5G19-01W-A
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,
},
"86181505": { // Soyealink SLT869-A51
    STC: 54,
    ZAIN: 54,
    MOBILY: 54,
    "GO Telecom": 54,
    Other: 54,

},
90909090:{
  STC: 2,
    ZAIN: 2,
    MOBILY: 2,
    "GO Telecom": 2,
    Other: 2,
}
};




const DEFAULT_PRICE = 55;

// Delivery Time Based on Network
const networkDeliveryTimes = {
  STC: "1–9 Days",
  ZAIN: "1–10 Hours",
  MOBILY: "1–9 Days",
  GO: "1-9 Days",
  Other: "1-9 Days",
};

async function createOrder(req, res) {
  const {
    country,
    brand,
    model,
    network,
    imei,
    serialNumber,
    mobileNumber,
    email,
    termsAccepted,
  } = req.body;

  console.log("[Create Order] Payload:", req.body);

  if (
    !country ||
    !brand ||
    !model ||
    !network ||
    !imei ||
    !serialNumber ||
    !email ||
    termsAccepted !== true
  ) {
    return res
      .status(400)
      .json({ error: "All fields are required and terms must be accepted" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!/^\d{15}$/.test(imei)) {
    return res.status(400).json({ error: "IMEI must be exactly 15 digits" });
  }

  const tac = imei.substring(0, 8);

  let amount = DEFAULT_PRICE;

  if (tacPricing[tac]) {
    if (tacPricing[tac][network] !== undefined) {
      // ✅ Exact TAC + network price found
      amount = tacPricing[tac][network];
    } else if (tacPricing[tac].Other !== undefined) {
      // ✅ Use TAC-specific "Other" as default
      amount = tacPricing[tac].Other;
    } else {
      console.warn(
        `[Create Order] TAC ${tac} exists but no price for network ${network}, using global default ${DEFAULT_PRICE}`
      );
    }
  } else {
    console.warn(
      `[Create Order] No TAC pricing found for ${tac}, using global default ${DEFAULT_PRICE}`
    );
  }

  const deliveryTime =
    networkDeliveryTimes[network] || networkDeliveryTimes.Other;

  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    request.requestBody({
      intent: "CAPTURE",
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: amount.toFixed(2),
              },
            },
          },
          description: `Instant digital unlock for ${brand} ${model} (${network}) - IMEI: ${imei}`,
          soft_descriptor: `UNLOCK-${brand.slice(0, 11).toUpperCase()}`,
          custom_id: `IMEI-${imei}`,
          items: [
            {
              name: `Unlock ${brand} ${model}`,
              description: `Instant digital unlock service (no shipping)`,
              sku: imei,
              unit_amount: {
                currency_code: "USD",
                value: amount.toFixed(2),
              },
              quantity: "1",
              category: "DIGITAL_GOODS",
            },
          ],
          payment_instruction: {
            disbursement_mode: "INSTANT",
          },
        },
      ],
    });

    const paypalOrder = await paypalClient.execute(request);
    const orderId = paypalOrder.result.id;

    const order = new Order({
      country,
      brand,
      model,
      network,
      imei,
      serialNumber,
      mobileNumber,
      email,
      termsAccepted,
      amount,
      currency: "USD",
      orderId,
      invoiceId: `INV-${orderId}`,
      deliveryTime,
      paymentType: "PayPal",
    });

    await order.save();

    res.json({
      orderId,
      amount,
      currency: "USD",
      clientId: process.env.PAYPAL_CLIENT_ID,
      deliveryTime,
    });
  } catch (error) {
    console.error("[Create Order] PayPal Error:", {
      status: error.statusCode,
      message: error.message,
      details: error.result?.details || error,
    });
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
}

module.exports = createOrder;
