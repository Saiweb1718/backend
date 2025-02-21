import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId, // id of the user who is subscribing
        ref : "User"
    },
        channel : {
            type : Schema.Types.ObjectId, // id of the channel to which the user is subscribing
            ref : "Channel"
        }
},{timestamps : true});

export default mongoose.model("Subscription",subscriptionSchema);