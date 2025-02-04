import React from 'react'; //어느 컴포넌트이든 React임포트가 필요합니다.
import ReactDOM from 'react-dom/client'; //root에 리액트 돔방식으로 렌더링시 필요합니다.
import axios from 'axios';
import DatePicker from 'react-datepicker';
import Calendar from 'react-calendar';
import { useState, useEffect } from 'react';
import { format, addHours } from 'date-fns';
import './UserReservationConfirm.css';


function UserReservationConfirm() {

  const [reserveModi, setReserveModi] = useState('');
  const [categories, setCategories] = useState([{
    serviceName: '',
    servicePrice: 0,
    isPaid: false,
    isRequired: false,
    subCategoryType: 'SELECT1',
    subCategories: [{ serviceName: '', servicePrice: '' }]
  }]);

  const [cateId, setCateId] = useState(0);

  useEffect(() => {
    const path = window.location.pathname;
    const pathSegments = path.split('/');
    const categoryId = pathSegments[pathSegments.length - 1];
    setCateId(categoryId);
  }, []);

  useEffect(() => {
    axios
      .get(`/adminReservation/getListDetail/${cateId}`)
      .then(response => {
        console.log(response.data);
        setReserveModi(response.data);
      })
      .catch(error => {
        console.log('Error Category', error);
      });

    axios
      .get(`/adminReservation/getMiddleItem/${cateId}`)
      .then(response => {
        console.log("get" + JSON.stringify(response.data));

        const transformedData = response.data.map(item => ({
          categoryId: item.categoryId,
          serviceName: item.serviceName,
          servicePrice: item.servicePrice,
          isPaid: item.isPaid === 'Y',
          isRequired: item.isRequired === 'Y',
          subCategoryType: item.subCategoryType,
          subCategories: item.subCategories.map(sub => ({
            serviceName: sub.serviceName,
            servicePrice: sub.servicePrice,
            categoryId: sub.categoryId
          }))
        }));
        setCategories(transformedData);
      })
      .catch(error => {
        console.log('Error subItemModi', error);
      });
  }, [cateId]);

  const [requestText, setRequestText] = useState(''); // 요청사항 입력값
  const [totalPrice, setTotalPrice] = useState(300000); // 총액 값 (임의로 설정)

  // 요청사항 입력값 관리
  const handleRequestChange = (e) => {
    setRequestText(e.target.value);
  };


  const calculateTotalPrice = () => {
    return combinedInputs.reduce((acc, item) => {
      if (typeof item === 'object' && item !== null) {
        console.log('Processing object:', item);
        // 객체의 각 값이 배열인 경우
        for (const key in item) {
          if (Array.isArray(item[key])) {
            console.log(`Processing array at key ${key}:`, item[key]);
            return acc + item[key].reduce((sum, innerItem) => {
              // innerItem이 객체인지 확인하고 servicePrice 합산
              return sum + (innerItem.servicePrice || 0);
            }, 0);
          } else {
            // 값이 배열이 아닐 경우 servicePrice 합산
            return acc + (item.servicePrice || 0);
          }
        }
      }
    }, 0);
  };


  //   
  const [formData, setFormData] = useState([]);
  const [combinedInputs, setCombinedInputs] = useState([]); // 배열로 초기화
  console.log(combinedInputs);
  console.log(formData);



  // useEffect를 사용하여 combinedInputs나 reserveModi가 업데이트될 때마다 총 가격을 계산
  useEffect(() => {
    const newTotalPrice = calculateTotalPrice() + (reserveModi.servicePrice || 0);
    setTotalPrice(newTotalPrice); // 총 가격 업데이트
    console.log(`Total Price: ${newTotalPrice}`); // 업데이트된 가격 로그
  }, [combinedInputs, reserveModi]); // reserveModi 추가



  // 세션 스토리지에서 데이터를 불러오는 함수
  const loadFromSessionStorage = () => {
    const storedData = sessionStorage.getItem('combinedInputs');
    if (storedData) {
      // JSON 문자열을 다시 객체로 변환
      const parsedData = JSON.parse(storedData);
      console.log(parsedData);
      setCombinedInputs(parsedData);
    }
    const storedformData = sessionStorage.getItem('formData');
    if (storedformData) {
      // JSON 문자열을 다시 객체로 변환
      const parsedFormData = JSON.parse(storedformData);
      console.log(parsedFormData);
      setFormData(parsedFormData);
    }
  };

  useEffect(() => {
    loadFromSessionStorage(); // 저장된 데이터를 불러옴
  }, []);


  //------------------------------------
  const slot = sessionStorage.getItem('selectSlot');
  const date = sessionStorage.getItem('formattedDate');
  const reservationSlotKey = sessionStorage.getItem('reservationSlotKey');
  const sessionSestoreNo = sessionStorage.getItem('storeNo');

  console.log('Slot:', slot);
  console.log('Date:', date);
  console.log('reservationSlotKey:', reservationSlotKey);
  console.log("categoryId:" + cateId);




  // sessionStorage에서 데이터 가져오기
  const storedData = sessionStorage.getItem('storeInfo');
  // 가져온 데이터를 변환하여 바로 사용
  const storeInfo = storedData ? JSON.parse(storedData) : null; // 데이터가 있을 경우만 변환
  console.log(storeInfo);
  console.log(reserveModi);
  console.log(categories);


  // ----------------------- 주문등록, 결제 부분 -----------------------
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(""); // 결제수단


  const requestPayment = (paymentMethod) => {

    let reservationNum = 0;

    const reservationData = {
      reservationTime: slot,  // 세션 데이터에서 가져옴
      reservationSlotKey: reservationSlotKey,  // 세션 데이터에서 가져옴
      customerRequest: requestText,  // 사용자 입력 요청사항
      reservationPrice: totalPrice  // 총액 정보
    };

    console.log('최종 예약 데이터:', reservationData);
    axios
      .post(`/userReservation/setReservationForm`, reservationData)
      .then(response => {
        const reservation_id = response.data;
        reservationNum = response.data;  // 예약 번호를 받아옴
        console.log("reservation_no 주문번호 ! : : ", reservation_id);

        // reservation_id가 설정된 후에 배열을 업데이트
        const updatedArray = formData.map(item => ({
          ...item,  // 기존 객체의 모든 속성 복사
          reservationNo: reservation_id  // reservationNo 추가
        }));

        console.log('업데이트된 배열:', updatedArray);

        // 필요시 여기서 두 번째 요청을 진행
        return axios.post(`/userReservation/setReservationFormDetail`, updatedArray);
      })
      .then(response => {
        console.log("슬롯 상태 업데이트 요청 성공! ", response.data);
        const categoryId = cateId;
        const storeNo = sessionSestoreNo;
        const reservationDate = date;

        console.log("전송될 데이터:", { categoryId, reservationDate, storeNo });

        return axios.post(`/userReservation/updateSlotStatus`, {
          categoryId,
          reservationDate,
          storeNo
        });
      })
      .then(response => {
        console.log("두 번째 요청 성공! ", response.data);
      })
      .catch(error => {
        console.error('Error during slot status update', error);
      });

    // ---------------------------------------------------------------------------

    //결제
    const { IMP } = window;
    if (!IMP) {
      console.error("IMP 객체가 정의되지 않았습니다. 아임포트 스크립트를 확인하세요.");
      return;
    }

    IMP.init("imp14516351"); // 아임포트에서 발급받은 가맹점 식별코드

    const data = {
      pg: "html5_inicis",
      pay_method: paymentMethod,
      merchant_uid: `mid_${new Date().getTime()}`,
      amount: totalPrice, // 결제 금액
      name: "테스트 상품",
      buyer_email: "buyer@example.com",
      buyer_name: "테스트 구매자",
      buyer_tel: "010-1234-5678",
      buyer_addr: "구매자 주소",
      buyer_postcode: "우편번호",
      m_redirect_url: window.location.href,
    };

    IMP.request_pay(data, async function (response) {
      if (response.success) {
        console.log("결제 성공:", response);
        alert(`결제 성공! 결제 ID: ${response.imp_uid}`);

        console.log("예약번호: " + reservationNum);

        // 결제 성공 후 DB에 저장
        await storePaymentInfo({
          paymentMethod: paymentMethod === "card" ? "간편결제" : "일반결제",
          paymentAmount: totalPrice,
          paymentStatus: "Y",
          reservationNo: reservationNum,
        });

        sessionStorage.setItem('storeInfo', JSON.stringify(storeInfo));
        sessionStorage.setItem('totalPrice', totalPrice);
        sessionStorage.setItem('reserveModi', JSON.stringify(reserveModi));
        sessionStorage.setItem('categories', JSON.stringify(categories));

        // 결제 성공 후 리다이렉트
        window.location.href = `../UserMyReservationList.user`;

      } else {
        console.log("결제 실패:", response);
        alert(`결제 실패! 에러 코드: ${response.error_code}, 에러 메시지: ${response.error_msg}`);

        // 결제 실패 시 결제 정보 초기화
        setSelectedPaymentMethod(""); 
        sessionStorage.removeItem('storeInfo');
        sessionStorage.removeItem('totalPrice');
        sessionStorage.removeItem('reserveModi'); 
        sessionStorage.removeItem('categories'); 
      }
    });
  };

  const storePaymentInfo = async (paymentData) => {
    try {
      const response = await fetch('/userPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      if (response.ok) {
        const result = await response.json();
        console.log("결제 정보 저장 성공:", result);
      } else {
        console.error("결제 정보 저장 실패:", response.statusText);
      }
    } catch (error) {
      console.error("결제 정보 저장 중 오류 발생:", error);
    }
  };



  return (
    <div>
      <div className="user-main-container">
        <div className="user-top-nav">
          <div className="user-top-btns">
            <button type="button">{"<"}</button>
            <logo className="logo">HandyLink</logo>
            <button type="button">{">"}</button>
          </div>
        </div>

        <div className="user-main-content">


          <div className="user-content-container2">
            <div className="user-reserve-title">예약자 정보</div>
            <div className="user-content-container3">
              <div className="sub-container3">
                <div className="bold-text">예약자 성함</div>
                <div>세션 이름</div>
              </div>

              <div className="sub-container3">
                <div className="bold-text">예약자 전화번호</div>
                <div>세션 번호</div>
              </div>
            </div>
          </div>
          <hr />


          <div className="user-content-container">
            <div className="user-reserve-menu">
              <div className="user-reserve-menu-img">
                <img src={`${reserveModi.imageUrl}`} alt="My Image" />
              </div>
              <div className="user-reserve-menu-content">
                <div>{reserveModi.serviceName} </div>
                <div>
                  {reserveModi.serviceContent}

                </div>
                <div> {reserveModi.servicePrice} 원 ~</div>

              </div>
            </div>
          </div>
          <hr />


          <div className="user-content-container2">
            <div className="user-reserve-title">예약일자</div>
            <div className="user-reserve-data">
              <div>
                <i className="bi bi-calendar-check-fill"></i> {date}
              </div>
              <div>
                <i className="bi bi-clock-fill"></i> {slot}
              </div>
            </div>
          </div>
          <hr />

          <div className="user-content-container6">
            <div className="user-reserve-title2">예약 정보</div>
          </div>
          <div className="user-content-container2">
            <div className="user-content-container3">
              <div>기본 가격 :  {reserveModi.serviceName} (+  {reserveModi.servicePrice} ) </div>
              <div>
                {categories.map((category, index) => (
                  <div key={index}>

                    <span>
                      <span>  {category.serviceName} :  {category.servicePrice > 0 && ( // 가격이 0보다 큰 경우에만 출력
                        <span>  (+ {category.servicePrice} )</span>
                      )}  </span>

                    </span>

                    <span>
                      {combinedInputs[index] && (
                        <span>
                          {Object.entries(combinedInputs[index]).map(([key, value]) => {

                            if (Array.isArray(value)) {
                              return value.map((item, itemIndex) => (
                                <span key={itemIndex}>
                                  {item.serviceName} (+{item.servicePrice})
                                </span>
                              ));
                            }

                            else if (typeof value === 'string') {
                              return (
                                <span key={key}>
                                  {value}
                                </span>
                              );
                            }

                            return null;
                          })}
                        </span>
                      )}

                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <hr />

          <div className="user-content-container2">


            <div className="user-content-container3">
              <div className="sub-container5">
                <div> 총액 </div>
                <div> {totalPrice} </div>
              </div>
            </div>
          </div>
          <hr />

          <div className="user-content-container2">


            <div className="user-content-container3">
              <div className="sub-title">
                요청사항
              </div>
              <div className="sub-container3">
                <input
                  className="input-text"
                  type="text"
                  value={requestText}
                  onChange={handleRequestChange}
                />
              </div>
            </div>
            {/* <div className="user-reserve-title"></div>
             <div className="user-content-container3">
                <div> 요청사항 </div>
                 <div>  <input
              type="text"
              value={requestText}
              onChange={handleRequestChange}
            /> </div> 
             </div> */}
          </div>
          <hr />

          <div className="user-content-container2">
            <div className="user-reserve-title">주의사항</div>

          </div>
          <hr />

          <div className="user-content-container2">
            <div className="user-reserve-title">취소 환불 규정 </div>

          </div>
          <hr />

          {/* <div className="user-content-container6">
            <div className="user-content-last">
              <button type="button" onClick={() => { submitBtn(); goToAdminPage(); }}>
                다음 <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div> */}


          {/* 결제 부분 */}
          <div className="user-content-container3">
            <div className="user-payment-title">
              <h3>결제수단</h3>
            </div>
            <div className="user-content-payment">
              <div className='user-payment-method'>
                <input
                  type="radio"
                  id="card"
                  name="paymentMethod"
                  value="card"
                  checked={selectedPaymentMethod === "card"}
                  onChange={() => setSelectedPaymentMethod("card")}
                />
                <label htmlFor="card">
                  <i className="bi bi-credit-card"></i> 간편결제
                </label>
              </div>
              <div className='user-payment-method'>
                <input
                  type="radio"
                  id="trans"
                  name="paymentMethod"
                  value="trans"
                  checked={selectedPaymentMethod === "trans"}
                  onChange={() => setSelectedPaymentMethod("trans")}
                />
                <label htmlFor="trans">
                  <i class="bi bi-cash-coin"></i> 일반결제
                </label>
              </div>
              <div className='user-payment-method'>
                <input
                  type="radio"
                  id="bank_transfer"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={selectedPaymentMethod === "bank_transfer"}
                  onChange={() => setSelectedPaymentMethod("bank_transfer")}
                />
                <label htmlFor="bank_transfer">
                  <i class="bi bi-credit-card-2-front"></i> 계좌이체
                </label>
              </div>
            </div>
            <button className="payment-button" onClick={async () => {
              if (selectedPaymentMethod === "bank_transfer") {
                try {
                  // 계좌이체 선택 시, 주문 정보 등록 후 결제 정보 저장
                  let reservationNum = 0;

                  const reservationData = {
                    reservationTime: slot,  // 세션 데이터에서 가져옴
                    reservationSlotKey: reservationSlotKey,  // 세션 데이터에서 가져옴
                    customerRequest: requestText,  // 사용자 입력 요청사항
                    reservationPrice: totalPrice  // 총액 정보
                  };

                  console.log('최종 예약 데이터 (계좌이체):', reservationData);

                  const response = await axios.post(`/userReservation/setReservationForm`, reservationData);
                  reservationNum = response.data;  // 예약 번호를 받아옴
                  console.log("계좌이체 주문번호 ! : : ", reservationNum);

                  // 결제 정보 저장
                  await storePaymentInfo({
                    paymentMethod: "계좌이체",
                    paymentAmount: totalPrice,
                    paymentStatus: "입금대기",
                    reservationNo: reservationNum,
                  });

                  sessionStorage.setItem('storeInfo', JSON.stringify(storeInfo));
                  // 결제 성공 후 리다이렉트
                  window.location.href = `../UserMyReservationDetail.user/${reservationNum}`;

                } catch (error) {
                  console.error("계좌이체 주문 등록 중 오류 발생:", error);
                  alert("주문 등록에 실패했습니다. 다시 시도해주세요.");
                }
              } else {
                requestPayment(selectedPaymentMethod);
              }
            }}>
              {totalPrice}원 결제하기
            </button>
          </div>




        </div>
      </div>


    </div>
  )
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <UserReservationConfirm />
);



