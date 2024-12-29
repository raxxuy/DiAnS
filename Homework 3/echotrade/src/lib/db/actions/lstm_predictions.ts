"use server";

import db from "..";

export async function getLSTMPredictions(issuerId: number) {
    const predictions = await db.lstm_predictions.findMany({
        where: {
            issuer_id: issuerId
        }
    });

    return predictions;
}