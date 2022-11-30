import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import Snackbar from '@mui/material/Snackbar';
import LocalOfferOutlinedIcon from '@material-ui/icons/LocalOfferOutlined';
import { Alert } from '@mui/material';
import {
	Container,
	Title,
	SubTitle,
	Description,
	Line,
	SubTotal,
	CheckoutContainer,
	AddressContainer,
	Instruction,
	ApplyCoupon,
	ApplyCouponButton,
	FinalCheckout,
	ConfirmOrderButton,
	Text,
} from './styles';
import { FlexColumn, FlexRow } from '../../common/styles';
import Address from './Address';
import FoodDetails from './FoodDetails';
import { useRequest } from '../../helpers/request-helper';
import { outlets } from '../../common/SelectOutlets';

const Checkout = () => {
	const [showNotification, setShowNotification] = useState({
		type: 'success',
		open: false,
		msg: '',
	});
	const [addressModal, setAddressModal] = useState(false);
	const [selectedFoodItem, setSelectedFoodItem] = useState({});
	const [selectedAddress, setSelectedAddress] = useState(null);
	const [selectedOutlet, setSelectedOutlet] = useState(null);
	const [showSelectedAddress, setShowSelectedAddress] = useState(false);
	const [discountAppliedDetails, setDiscountAppliedDetails] = useState(0)
	const [foodTotal, setFoodTotal] = useState(0);
	const [suggestion, setSuggestion] = useState('')

	useEffect(() => {
		const items = JSON.parse(localStorage.getItem('checkoutItem'));
		setSelectedFoodItem(items);
	}, []);

	const [{ loading: placeOrderLoading }, placeOrderApi] = useRequest(
		{
			url: '/order/add',
			method: 'POST',
		},
		{ manual: true },
	);

	const [{ loading: addAddessLoading }, addAddress] = useRequest(
		{
			url: '/address/add',
			method: 'POST',
		},
		{ manual: true },
	);

	const [{ loading: loadingDiscount }, applicableDiscountApi] = useRequest(
		{
			url: '/discount/discountByOrderPrice',
			method: 'POST',
		},
		{ manual: true },
	);

	const getApplicableDiscount= async ()=>{
		let payload={priceRange:foodTotal}
		await applicableDiscountApi({
			data: payload,
			headers: {
				'x-access-token': localStorage.getItem('afjalMao-x-access-token'),
			},
		}).then((result)=>{
			console.log("RESULT ",result);
			const dis=result.data.data;
			setDiscountAppliedDetails(dis);
		}).catch((err)=>{
			console.log("R ",err);
		})
	}

	useEffect(() => {
	  
		if(discountAppliedDetails.totalDiscountAmount){
			setFoodTotal(foodTotal-discountAppliedDetails.totalDiscountAmount)
		}
	}, [discountAppliedDetails.totalDiscountAmount])
	

	
	useEffect(() => {
		let totalPrice=0;
		console.log("selectedFoodItem asasa ",selectedFoodItem);
		Object.values(selectedFoodItem).forEach((values) => {
			if (values?.half >= 1) {
				totalPrice += values?.halfPrice * values?.half;
			}
			if (values?.full >= 1) {
				totalPrice += values?.fullPrice * values?.full;
			}
		});
		setFoodTotal(totalPrice);
	}, [selectedFoodItem])
	

	useEffect(() => {	  
		if(foodTotal && !discountAppliedDetails){
			getApplicableDiscount();
		}
	}, [foodTotal])
	


	const handleClose = (event, reason) => {
		// if (reason === 'clickaway') {
		// return;
		// }
		setShowNotification((prev) => {
			return {
				...prev,
				open: false,
			};
		});
	};

	const placeOrder=()=>{

		if(!selectedAddress){
			setShowNotification({
				type: 'error',
				open: true,
				msg: 'Please select delivery address',
			});
			return;
		}

		if (!selectedOutlet) {
			setShowNotification({
				type: 'error',
				open: true,
				msg: 'Please select the mao outlet',
			});
			return;
		}

		const payload = {
			product: selectedFoodItem,
			addressId: selectedAddress.id,
			modeOfPayment: 'cash',
			outletName: selectedOutlet.value,
			discountId:'',
		};
		placeOrderApi({
			data: payload,
			headers: {
				'x-access-token': localStorage.getItem('afjalMao-x-access-token'),
			},
		})
			.then((result) => {
				console.log('result ', result);
				setShowNotification({
					type: 'success',
					open: true,
					msg: 'Order placed successfully',
				});
			})
			.catch((error) => {});
	};

	const handleModalClose = () => {
		setAddressModal(false);
	};

	const handleAddAddress= async (addressDetails)=>{
		await addAddress({
			headers: {
				'x-access-token': localStorage.getItem('afjalMao-x-access-token'),
			},
			data:addressDetails
		}).then((result)=>{
			console.log(result);
			handleModalClose();
			setShowNotification({
					type: 'success',
					open: true,
					msg: `Address added successfully`,
			});
			setSelectedAddress(result.data.data)
			setShowSelectedAddress(true);
		}).catch(err=>{
			console.log(err);
			return false;
		})
	}

	return (
		<Container>
			<Title>Checkout</Title>
			{Object.keys(selectedFoodItem).length>0 &&
				<FlexColumn>
				<FlexRow>
					<AddressContainer>
						<Address setShowSelectedAddress={setShowSelectedAddress} showSelectedAddress={showSelectedAddress} addressModal={addressModal} setAddressModal={setAddressModal} handleModalClose={handleModalClose} handleAddAddress={handleAddAddress} setSelectedAddress={setSelectedAddress} selectedAddress={selectedAddress} />
						<FlexRow style={{ alignItems: 'center', justifyContent: 'space-between' }}>
							<Text>Select Outlet</Text>
							<Select onChange={setSelectedOutlet} options={outlets} />
						</FlexRow>
					</AddressContainer>
					<CheckoutContainer>
						<SubTitle>Cart Details</SubTitle>
						{Object.keys(selectedFoodItem).length ? (
							<>
								<Description>
									You choosed awesome item, please go ahead to complete your order
								</Description>
								{/* {JSON.stringify(discountAppliedDetails)} */}
								<Instruction
									onChange={(e) => setSuggestion(e.target.value)}
									value={suggestion}
									placeholder="Any Suggestion or Instruction?"
								/>
								<Line />
								<FoodDetails selectedFoodItem={selectedFoodItem} />
								{
									discountAppliedDetails.discounts &&
									<>
										<ApplyCoupon>
									<ApplyCouponButton>
										<LocalOfferOutlinedIcon
											style={{ marginTop: 'auto', marginRight: '8px' }}
										/>{' '}
										
										{discountAppliedDetails.discounts!==[]?<>
											{discountAppliedDetails.discounts.discountType === 'Flat/Absolute' && 'Rs '}
										{discountAppliedDetails.discounts.discountValue
											? `${discountAppliedDetails.discounts.discountValue} `
											: '____'}
										{discountAppliedDetails.discounts.discountType === 'Percentage' && '%'} off on order above{' '}
										{discountAppliedDetails.discounts.discountOnOrderAbove
											? discountAppliedDetails.discounts.discountOnOrderAbove
											: '____'}
										</>:<>
											Not applicable for Discount
										</>}
										</ApplyCouponButton>
								</ApplyCoupon>
								<FlexRow
								style={{
									marginTop: '20px',
									width: '75%',
									marginLeft: 'auto',
									marginRight: 'auto',
								}}
								>
								<FlexColumn style={{ width: '90%' }}>Total Discount </FlexColumn>
								<FlexColumn>₹ {discountAppliedDetails.totalDiscountAmount}</FlexColumn>
								</FlexRow>
									</>
								}
								<FlexRow
									style={{
										marginTop: '15%',
										width: '75%',
										marginLeft: 'auto',
										marginRight: 'auto',
									}}
								>
									<FlexColumn style={{ width: '50%' }}>
										<SubTotal>Subtotal</SubTotal>
									</FlexColumn>
									<FlexColumn style={{ width: '50%', textAlign: 'right' }}>
										₹ {foodTotal}
									</FlexColumn>
								</FlexRow>
							</>
						) : null}
						<FinalCheckout>
							<FlexRow style={{ alignItems: 'center', justifyContent: 'space-between' }}>
								<ConfirmOrderButton onClick={placeOrder} >CONFIRM ORDER</ConfirmOrderButton>
							</FlexRow>
						</FinalCheckout>
					</CheckoutContainer>
				</FlexRow>
			</FlexColumn>
			
			}

			{Object.keys(selectedFoodItem).length==0 && <h2>No Food Item selected</h2>}

			<Snackbar
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
				autoHideDuration={2000}
				open={showNotification.open}
				onClose={handleClose}
				key={'to' + 'right'}
			>
				<Alert
					onClose={handleClose}
					severity={showNotification.type}
					sx={{ width: '100%' }}
				>
					{showNotification.msg}
				</Alert>
			</Snackbar>
		</Container>
	);
};

export default Checkout;
