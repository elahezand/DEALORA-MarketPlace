exports.createPayment = async (amountInRial, description, mobile) => {
    const response = await fetch(
        process.env.ZARINPAL_API_BASE_URL,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                merchant_id: process.env.ZARINPAL_MERCHANT_ID,
                callback_url: process.env.ZARINPAL_PAYMENT_CALLBACK_URL,
                amount: amountInRial,
                description,
                metadata: { mobile },
            }),
        }
    );

    const data = await response.json();

    if (!response.ok || data?.errors) {
        throw new Error("Payment request failed");
    }

    return data;
};

exports.verifyPayment = async (authority, amountInRial) => {
    const response = await fetch(
        process.env.ZARINPAL_VERIFY_URL,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                merchant_id: process.env.ZARINPAL_MERCHANT_ID,
                authority,
                amount: amountInRial,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok || data?.errors) {
        return {
            success: false,
            message: "Payment verification failed",
        };
    }
    if (data.data?.code === 100 || data.data?.code === 101) {
        return {
            success: true,
            refId: data.data.ref_id,
        };
    }

    return {
        success: false,
        message: "Payment not verified",
    };
};