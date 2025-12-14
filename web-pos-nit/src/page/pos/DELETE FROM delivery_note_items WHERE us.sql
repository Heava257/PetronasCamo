DELETE FROM delivery_note_items WHERE user_id = 72;

DELETE FROM delivery_note WHERE user_id = 72;
DELETE FROM customer_debt WHERE user_id = 72;
DELETE FROM payments WHERE user_id = 72;
DELETE FROM customer WHERE user_id = 72;

 	DELETE FROM `order` WHERE user_id = 3;