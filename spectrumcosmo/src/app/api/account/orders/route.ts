export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  
  // Allow guest checkout (user can be null)
  let userId = user?.id || null;
  let customerEmail = user?.email || null;

  try {
    await ensureOrdersSchema();
    const sql = getDb();
    const body = await req.json();
    
    const {
      customer_name,
      phone_number,
      customer_email,
      total_amount,
      payment_method,
      delivery_method_id,
      delivery_fee,
      location,
      notes,
      items,
    } = body;
    
    if (!customer_name || !phone_number || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const orderNumber = generateOrderNumber();
    
    const [order] = await sql`
      INSERT INTO orders (
        order_number, 
        user_id, 
        customer_name, 
        customer_email, 
        phone_number,
        delivery_address,
        total_amount, 
        payment_method, 
        payment_status, 
        notes, 
        status, 
        created_at, 
        updated_at
      ) VALUES (
        ${orderNumber}, 
        ${userId}, 
        ${customer_name}, 
        ${customer_email || customerEmail},
        ${phone_number},
        ${location || null},
        ${total_amount || 0}, 
        ${payment_method || null},
        'pending', 
        ${notes || null}, 
        'pending', 
        NOW(), 
        NOW()
      )
      RETURNING *
    `;
    
    // Insert order items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (
          order_id, 
          product_id, 
          product_name, 
          quantity, 
          price, 
          created_at
        ) VALUES (
          ${order.id}, 
          ${item.product_id || null}, 
          ${item.product_name},
          ${item.quantity}, 
          ${item.price}, 
          NOW()
        )
      `;
    }
    
    // Send confirmation email
    const emailTo = customer_email || customerEmail;
    if (emailTo) {
      await sendMail({
        to: emailTo,
        subject: `Order Confirmation - ${orderNumber}`,
        text: `Thank you for your order! Your order number is ${orderNumber}. We will notify you once your order is processed.`,
      }).catch(() => null);
    }
    
    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `New Order Received - ${orderNumber}`,
        text: `A new order has been placed by ${customer_name}. Order number: ${orderNumber}. Total: MWK ${total_amount}`,
      }).catch(() => null);
    }
    
    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create order:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
