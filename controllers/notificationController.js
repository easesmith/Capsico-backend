exports.notify = (io, message) => {
    io.on('connection', (socket) => {

        socket.on('joinDeliveryExecRoom', (deliveryExecId) => {
            socket.join(deliveryExecId);
            console.log(`Delivery executive ${deliveryExecId} joined room ${deliveryExecId}`);
        });

        socket.on('joinRestaurantRoom', (restaurantId) => {
            socket.join(restaurantId);
            console.log(`Restaurant ${restaurantId} joined room ${restaurantId}`);
        });

        socket.on('joinUserRoom', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);
        });

        socket.on('notify-user', (message) => {
            io.emit('message', message);
        });

        socket.on('notify-restaurant-about-order', (message) => {
            io.emit('message', message);
        });

        socket.on('notify-deliveryExec-about-order', (message) => {
            io.emit('message', message);
        });

        socket.on('disconnect', () => {
            console.log('disconnected');
        });
    });
}