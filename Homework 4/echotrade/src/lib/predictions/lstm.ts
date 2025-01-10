import { getLSTMPredictions } from "../db/actions/lstm_predictions";

export interface LSTMPrediction {
  prediction_date: string;
  predicted_price: number;
}

export async function LSTM(issuerId: number): Promise<LSTMPrediction[]> {
  const predictions = await getLSTMPredictions(issuerId);

  return predictions.map(prediction => ({
    prediction_date: prediction.prediction_date.toISOString(),
    predicted_price: prediction.predicted_price
  }));
}
