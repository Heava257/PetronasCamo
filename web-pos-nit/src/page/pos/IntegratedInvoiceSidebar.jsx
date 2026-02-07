import React, { useState, useEffect } from "react";
import { Button, Input, Select, DatePicker, Tag, message } from "antd";
import {
    ShoppingCartOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    EyeOutlined,
    EnvironmentOutlined,
    CarOutlined,
    CalendarOutlined,
    UserOutlined,
    FileTextOutlined,
    DollarOutlined,
    ClearOutlined,
    ContainerOutlined,
    PercentageOutlined
} from "@ant-design/icons";
import dayjs from 'dayjs';
import { request, formatPrice, formatQty } from "../../util/helper";
import './Integratedinvoicesidebar.css';

const { TextArea } = Input;
const { Option } = Select;

const IntegratedInvoiceSidebar = ({
    t,
    cartItems = [],
    objSummary,
    selectedLocations = [],
    setSelectedLocations,
    setObjSummary,
    customers = [],
    handleClearCart,
    handleQuantityChange,
    handleClickOut,
    handleRemoveCartItem,
    isDisabled = false,
    isCheckingOut = false,
    setState,
    selectedLocation,
    setSelectedLocation,
    selectedTruck,
    setSelectedTruck,
    trucks = [],
    setShowPreviewModal
}) => {
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    // Sync selectedLocation ID to selectedLocations object for PrintInvoice
    useEffect(() => {
        if (selectedLocation && locations.length > 0 && setSelectedLocations) {
            // Avoid infinite loop if already set
            if (selectedLocations.length === 1 && selectedLocations[0].id === selectedLocation) return;

            const locObj = locations.find(l => l.id === selectedLocation);
            if (locObj) {
                setSelectedLocations([{
                    label: locObj.location_name,
                    value: locObj.id,
                    ...locObj
                }]);
            } else if (selectedLocation) {
                // Handle manual text entry (e.g. from PreOrderForm)
                setSelectedLocations([{
                    label: selectedLocation,
                    value: selectedLocation
                }]);
            }
        }
    }, [selectedLocation, locations]);

    // Calculate totals
    const calculateTotals = () => {
        let subtotal = 0;
        let totalQty = 0;

        cartItems.forEach(item => {
            const qty = Number(item.cart_qty || 0);
            const selling = Number(item.selling_price || 0);
            const actual = Number(item.actual_price || 1);
            const discount = Number(item.discount || 0) / 100;

            totalQty += qty;
            subtotal += (qty * selling * (1 - discount)) / actual;
        });

        return {
            subtotal: formatPrice(subtotal),
            totalQty: formatQty(totalQty),
            total: formatPrice(subtotal)
        };
    };

    const totals = calculateTotals();

    // Fetch locations when customer changes
    useEffect(() => {
        const fetchCustomerLocations = async () => {
            if (!objSummary.customer_id) {
                setLocations([]);
                return;
            }

            setLoadingLocations(true);
            try {
                const locRes = await request(`locations?customer_id=${objSummary.customer_id}`, 'get');
                if (locRes && locRes.list) {
                    setLocations(locRes.list);

                    // Auto-select logic
                    if (locRes.list.length > 0) {
                        // Only auto-select if no location is currently selected
                        // or if the current selection is NOT in the new list
                        const isCurrentStillValid = locRes.list.some(l => l.id === selectedLocation);

                        if (!selectedLocation || !isCurrentStillValid) {
                            const defaultLoc = locRes.list.find(l => l.is_default === 1);
                            if (defaultLoc) {
                                setSelectedLocation(defaultLoc.id);
                            } else {
                                setSelectedLocation(locRes.list[0].id);
                            }
                        }
                    } else {
                        setSelectedLocation(null);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch locations:", error);
            } finally {
                setLoadingLocations(false);
            }
        };

        fetchCustomerLocations();
    }, [objSummary.customer_id, setSelectedLocation]);

    const selectedLocationData = locations.find(loc => loc.id === selectedLocation);
    const selectedTruckData = trucks.find(truck => truck.id === selectedTruck);

    return (
        <div className="invoice-sidebar-no-scroll">
            {/* Header - Fixed at top */}


            {/* Main Content Grid - 3 Columns */}
            <div className="sidebar-content-grid">
                {/* LEFT COLUMN - Cart Items */}
                <div className="grid-column cart-column">
                    <div className="column-title">
                        <ShoppingCartOutlined /> បញ្ជីផលិតផល
                    </div>

                    <div className="cart-items-compact">
                        {cartItems.length === 0 ? (
                            <div className="empty-cart-message">
                                មិនមានផលិតផល
                            </div>
                        ) : (
                            cartItems.map((item, idx) => {
                                const isExceeded = Number(item.cart_qty) > Number(item.available_qty);
                                return (
                                    <div key={item.id} className={`cart-item-compact ${isExceeded ? 'item-error-border' : ''}`}>
                                        <div className="item-header-row">
                                            <span className="item-number">#{idx + 1}</span>
                                            <span className="item-name">{item.name}</span>
                                            <button
                                                className="item-remove-btn"
                                                onClick={() => handleRemoveCartItem(item.id)}
                                            >
                                                <DeleteOutlined />
                                            </button>
                                        </div>

                                        <div className="item-category-tag">
                                            {item.category_name}
                                        </div>

                                        <div className="item-controls-row">
                                            <div className="item-qty-control">
                                                <label>បរិមាណ:</label>
                                                <input
                                                    type="number"
                                                    value={item.cart_qty}
                                                    onChange={(e) => handleQuantityChange(e.target.value, item.id)}
                                                    min="0"
                                                    max={item.available_qty}
                                                    className={`qty-input-compact ${isExceeded ? 'input-error' : ''}`}
                                                />
                                                <span className="qty-unit">L</span>
                                            </div>

                                            <div className="item-price-display">
                                                <div className="price-info-group">
                                                    <div className="price-label">តម្លៃ/{parseFloat(item.actual_price || 1) <= 1 ? 'L' : 'T'}:</div>
                                                    <div className="price-value">{formatPrice(item.selling_price)}</div>
                                                    {item.discount > 0 && (
                                                        <div className="item-discount-badge">
                                                            -{item.discount}%
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="item-row-total">
                                                    {formatPrice((Number(item.cart_qty || 0) * Number(item.selling_price || 0) * (1 - (Number(item.discount || 0) / 100))) / Number(item.actual_price || 1))}
                                                </div>
                                                <div className="item-calc-formula">
                                                    ({formatQty(item.cart_qty)}L / {item.actual_price}) x {formatPrice(item.selling_price)}
                                                </div>
                                                {isExceeded && (
                                                    <div className="stock-error-message">
                                                        ⚠️ ស្តុកមិនគ្រប់គ្រាន់ (Max: {formatQty(item.available_qty)})
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="item-stock-row">
                                            <span className="stock-label">ស្តុកមាន:</span>
                                            <span className="stock-value">{formatQty(item.available_qty)}L</span>
                                        </div>




                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* MIDDLE COLUMN - Customer & Delivery Info */}
                <div className="grid-column info-column">
                    <div className="column-title">
                        <UserOutlined /> ព័ត៌មានអតិថិជន
                    </div>

                    <div className="info-form-compact">
                        <div className="form-group-compact">
                            <label className="form-label-compact">
                                <UserOutlined /> អតិថិជន
                            </label>
                            <Select
                                value={objSummary.customer_id}
                                onChange={(value) => {
                                    const customer = customers.find(c => c.value === value);
                                    setObjSummary(prev => ({
                                        ...prev,
                                        customer_id: value,
                                        customer_name: customer?.name,
                                        customer_address: customer?.address,
                                        customer_tel: customer?.tel
                                    }));
                                }}
                                className="select-compact"
                                showSearch
                                optionFilterProp="children"
                                disabled={isDisabled}
                            >
                                {customers.map(customer => (
                                    <Option key={customer.value} value={customer.value}>
                                        {customer.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <div className="form-group-compact">
                            <label className="form-label-compact">
                                <EnvironmentOutlined /> ទីតាំងដឹក *
                            </label>
                            <Select
                                value={selectedLocation}
                                onChange={(val) => {
                                    setSelectedLocation(val);
                                    const locObj = locations.find(l => l.id === val);
                                    if (locObj && setSelectedLocations) {
                                        setSelectedLocations([{
                                            label: locObj.location_name,
                                            value: locObj.id,
                                            ...locObj
                                        }]);
                                    }
                                }}
                                className="select-compact"
                                placeholder="ជ្រើសរើសទីតាំង"
                                loading={loadingLocations}
                            >
                                {locations.map(loc => (
                                    <Option key={loc.id} value={loc.id}>
                                        {loc.location_name}
                                    </Option>
                                ))}
                            </Select>
                            {selectedLocationData && (
                                <div className="selected-info-display">
                                    <div className="info-name">{selectedLocationData.location_name}</div>
                                    <div className="info-address">{selectedLocationData.address}</div>
                                </div>
                            )}
                        </div>

                        <div className="form-group-compact">
                            <label className="form-label-compact">
                                <CarOutlined /> ឡានដឹកជញ្ជូន
                            </label>
                            <Select
                                value={selectedTruck}
                                onChange={setSelectedTruck}
                                className="select-compact"
                                placeholder="ជ្រើសរើសឡាន"
                                allowClear
                            >
                                {trucks.map(truck => (
                                    <Option key={truck.id} value={truck.id}>
                                        {truck.plate_number} - {truck.driver_name}
                                    </Option>
                                ))}
                            </Select>
                            {selectedTruckData && (
                                <div className="selected-info-display">
                                    <div className="info-name">{selectedTruckData.plate_number}</div>
                                    <div className="info-address">ប្រគល់: {selectedTruckData.driver_name}</div>
                                </div>
                            )}
                        </div>

                        <div className="form-row-compact">
                            <div className="form-group-compact half-width">
                                <label className="form-label-compact">
                                    <CalendarOutlined /> កាលបរិច្ឆេទបញ្ជាទិញ
                                </label>
                                <DatePicker
                                    value={objSummary.order_date ? dayjs(objSummary.order_date) : null}
                                    onChange={(date) => setObjSummary(prev => ({
                                        ...prev,
                                        order_date: date ? date.format('YYYY-MM-DD') : null
                                    }))}
                                    format="DD/MM/YYYY"
                                    className="date-picker-compact"
                                />
                            </div>

                            <div className="form-group-compact half-width">
                                <label className="form-label-compact">
                                    <CalendarOutlined /> កាលបរិច្ឆេទដឹកជញ្ជូន
                                </label>
                                <DatePicker
                                    value={objSummary.delivery_date ? dayjs(objSummary.delivery_date) : null}
                                    onChange={(date) => setObjSummary(prev => ({
                                        ...prev,
                                        delivery_date: date ? date.format('YYYY-MM-DD') : null
                                    }))}
                                    format="DD/MM/YYYY"
                                    className="date-picker-compact"
                                />
                            </div>
                        </div>

                        <div className="form-group-compact">
                            <label className="form-label-compact">
                                <FileTextOutlined /> កំណត់សម្គាល់
                            </label>
                            <TextArea
                                value={objSummary.remark}
                                onChange={(e) => setObjSummary(prev => ({
                                    ...prev,
                                    remark: e.target.value
                                }))}
                                placeholder="បញ្ចូលកំណត់សម្គាល់..."
                                rows={3}
                                className="textarea-compact"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Summary & Actions */}
                <div className="grid-column summary-column">
                    <div className="column-title">
                        <DollarOutlined /> សង្ខេបការបញ្ជាទិញ
                    </div>

                    <div className="summary-content">
                        {objSummary.pre_order_no && (
                            <div className="summary-po-info">
                                <div className="po-badge">
                                    <ContainerOutlined /> កម្មង់ជាមុន #{objSummary.pre_order_no}
                                </div>
                            </div>
                        )}

                        <div className="summary-stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">បរិមាណសរុប</div>
                                <div className="stat-value">{totals.totalQty} L</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-label">ចំនួនផលិតផល</div>
                                <div className="stat-value">{cartItems.length}</div>
                            </div>
                        </div>

                        <div className="summary-breakdown">

                            <div className="breakdown-row total-row">
                                <span className="breakdown-label">សរុបត្រូវបង់:</span>
                                <span className="breakdown-value total-value">{totals.total}</span>
                            </div>
                        </div>

                        <div className="action-buttons-stack">
                            <Button
                                type="primary"
                                size="large"
                                icon={<CheckCircleOutlined />}
                                onClick={handleClickOut}
                                loading={isCheckingOut}
                                disabled={isDisabled || cartItems.length === 0 || cartItems.some(i => Number(i.cart_qty) > Number(i.available_qty))}
                                className="btn-checkout-compact"
                                block
                            >
                                គិតលុយ
                            </Button>

                            <Button
                                size="large"
                                icon={<EyeOutlined />}
                                onClick={() => setShowPreviewModal(true)}
                                disabled={cartItems.length === 0 || cartItems.some(i => Number(i.cart_qty) > Number(i.available_qty))}
                                className="btn-preview-compact"
                                block
                            >
                                ត្រួតពិនិត្យ
                            </Button>

                            <Button
                                size="large"
                                danger
                                icon={<ClearOutlined />}
                                onClick={handleClearCart}
                                disabled={cartItems.length === 0}
                                className="btn-clear-compact"
                                block
                            >
                                សម្អាត
                            </Button>
                        </div>

                        {selectedLocation && (
                            <div className="validation-note">
                                ✅ ទីតាំងដឹកជញ្ជូនត្រូវបានជ្រើសរើស
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegratedInvoiceSidebar;