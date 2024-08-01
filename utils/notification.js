const io = require("../server");

const notifyDeliveryExec = (deliveryExecId, orderId) => {
    console.log("io",io.to);
    io.to(deliveryExecId).emit('orderAssigned', { orderId });
    // Implement your notification logic here
    console.log(`Notifying delivery executive ${deliveryExecId} about order ${orderId}`);
};

module.exports = { notifyDeliveryExec }