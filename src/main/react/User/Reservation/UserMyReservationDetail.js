import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { FaCalendar, FaClock } from 'react-icons/fa';
import './UserMyReservationDetail.css';



function UserMyReservationDetail() {
  const [cateId, setCateId] = useState(0);
  const [reservationList, setReservationList] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState([]);
  const [reservationDetail, setReservationDetail] = useState({});
  const [storeInfo, setStoreInfo] = useState({});


  useEffect(() => {
    const path = window.location.pathname;
    const pathSegments = path.split('/');
    const categoryId = pathSegments[pathSegments.length - 1];
    setCateId(categoryId);

    // 예약 정보 가져오기
    axios.get(`/userMyReservation/getMyReservationDetail/${categoryId}`)
      .then(response => {
        console.log(response.data);
        setReservationList(response.data);
      })
      .catch(error => {
        console.log('Error fetching reservation list:', error);
      });

    // 결제 정보 가져오기
    axios.get(`/userPaymentInfo/getPaymentInfo/${categoryId}`)
      .then(response => {
        console.log(response.data);
        setPaymentInfo(response.data);
      })
      .catch(error => {
        console.log('Error fetching payment info:', error);
      });

    // 예약 상세 정보 가져오기
    axios.get(`/userReservation/getReservationDetail/${categoryId}`)
      .then(response => {
        console.log(response.data);
        setReservationDetail(response.data);
      })
      .catch(error => {
        console.log('Error fetching reservation detail:', error);
      });
  }, []);


  const [category, setCategory] = useState({
    categoryLevel: 0,
    parentCategoryLevel: 0,
    serviceName: '',
    servicePrice: 0,
    serviceContent: ''
  });

  // 결제 일시 포맷 (년/월/일 시:분:초)
  const formatDate = (dateString) => {
    const [date, time] = dateString.split('T');
    const formattedDate = date.replace(/-/g, '.'); // '-'을 '/'로 변경
    return `${formattedDate} ${time.substring(0, 8)}`; // 'YYYY/MM/DD HH:MM:SS' 형식으로 반환
  };


  // 예약 취소 버튼 클릭 시 결제 상태 업데이트
  const cancelReservation = async () => {
    const reservationNo = cateId;
    const storeName = reservationList.length > 0 ? reservationList[0].storeName : '정보 없음';
    try {
      const response = await axios.post(`/userPaymentCancel/updatePaymentStatus/${reservationNo}`, { paymentStatus: "N", storeName });
      console.log("예약 취소 성공:", response.data);
      alert("예약이 취소되었습니다.");

      // 페이지를 새로 고침하거나 다른 작업 수행
      window.location.reload();
    } catch (error) {
      console.error("예약 취소 중 오류 발생:", error);
      alert("예약 취소에 실패했습니다. 다시 시도해주세요.");
    }
  };



  // 계좌번호 복사
  const copyToClipboard = () => {
    if (reservationList.length > 0) {
      navigator.clipboard.writeText(reservationList[0].accountNumber)
        .then(() => {
          console.log('계좌번호가 복사되었습니다.');
        })
        .catch(err => {
          console.error('계좌번호 복사에 실패했습니다:', err);
        });
    }
  };


  // ------------

  return (
    <div>
      <div className="user-content-container">
        <div className='store-name'>{reservationList.length > 0 ? reservationList[0].storeName : '정보 없음'}</div>
        <div className='payment-date'>{reservationDetail.regTime}</div>
      </div>

      {/* 입금정보 */}
      <div className="user-content-container">
        <div className='payment-info-top'>
          <div className='deposit-date'></div>
        </div>
        <div className="payment-info-top">
          <div className="account-left">입금 대기금액</div>
          <div className="account-right"> {paymentInfo.length > 0 ? paymentInfo[0].paymentAmount : '정보 없음'} 원</div>
        </div>
        <div className="payment-info-top">
          <div className="account-left">입금 계좌</div>
          <div className="account-right">
            {reservationList.length > 0 ? reservationList[0].accountBank : '정보 없음'} {reservationList.length > 0 ? reservationList[0].accountNumber : '정보 없음'}
            <button className='account-number-copy-btn' onClick={copyToClipboard} ><i class="bi bi-copy"></i></button>
          </div>
        </div>
      </div>

      <div className="user-content-container">
        <div className="info-row">
          <div className="left"><i class="bi bi-calendar-check-fill"></i> {reservationDetail.regTime} </div>
          <div className="right"><i class="bi bi-clock-fill"></i> {reservationDetail.reservationTime} </div>
        </div>
      </div>


      {/* 예약자정보 */}
      <div className="user-content-container">
        예약자 정보
      </div>


      {/* 예약 정보 */}
      <div className="user-content-container">
        <div className="header">예약 정보</div>
        <div className="payment-info">
          {/* 대분류와 중분류 출력 */}
          {reservationList.map((item, resIndex) => {
            const isFirstInGroup = resIndex === 0 || reservationList[resIndex - 1].mainCategoryName !== item.mainCategoryName;
            const isMiddleCategoryDifferent = resIndex === 0 || reservationList[resIndex - 1].middleCategoryName !== item.middleCategoryName;

            return (
              <div key={resIndex}>
                {/* 대분류 출력 */}
                {isFirstInGroup && (
                  <div className="info-row">
                    <div className="left"><i className="bi bi-dot"></i> {item.mainCategoryName}</div>
                    <div className="right">(+{item.mainPrice}원)</div>
                  </div>
                )}

                {/* 중분류 출력 (첫 번째 항목에만) */}
                <div className="info-row info-row2">
                  {isMiddleCategoryDifferent && (
                    <div className="left"> <i class="bi bi-check2"></i> {item.middleCategoryName}</div>
                  )}
                  {/* 서브카테고리 출력 */}
                  <div className="right">{item.subCategoryName} (+{item.subPrice}원)</div>
                </div>

              </div>
            );
          })}
        </div>
      </div>


      {/* 결제금액 */}
      <div className="user-content-container">
        <div className='totalPrice'>
          <div className="info-row">
            <div className="left">결제금액</div>
            <div className="right">{paymentInfo.length > 0 ? paymentInfo[0].paymentAmount : '정보 없음'} 원</div>
          </div>
        </div>
      </div>


      {/* 요청사항 */}
      <div className="user-content-container">
        <div className="info-row">
          <div className="left">요청사항</div>
          <div className="right"> {reservationDetail.customerRequest} </div>
        </div>
      </div>


      {/* 결제정보 */}
      <div className="user-content-container">
        <div className="payment-info-top">
          <div className="payment-left">결제 정보</div>
          <div className="payment-right">
            <a href={`/paymentInfo.user/${cateId}`}>결제 상세</a>
          </div>

        </div>
        <div className="payment-info">
          {paymentInfo.length > 0 ? (
            paymentInfo.map((payment, index) => (
              <div key={index} className="info-row">
                <div className="left">결제 일시</div>
                <div className="right">{formatDate(payment.paymentDate)}</div>
              </div>
            ))
          ) : (
            <div className="info-row">
              <div className="left">결제 정보가 없습니다.</div>
            </div>
          )}
          {paymentInfo.length > 0 && paymentInfo.map((payment, index) => (
            <div key={index}>
              <div className="info-row">
                <div className="left">결제수단</div>
                <div className="right">{payment.paymentMethod}</div>
              </div>
              <div className="info-row">
                <div className="left">결제 금액</div>
                <div className="right">{payment.paymentAmount}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="user-content-container">
        <button onClick={cancelReservation}>예약취소</button>
      </div>





      <hr />

      <hr />

      <h1> 주의사항 </h1>

      <hr />

      <h1> 환불규정 </h1>

      <hr />




    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserMyReservationDetail />
);