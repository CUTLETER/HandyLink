import React, { useState, useEffect, useRef } from 'react';
import { formatISO } from 'date-fns';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import Calendar from 'react-calendar';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import 'react-calendar/dist/Calendar.css';
import './StoreDayOff.css';

function StoreDayOff() {
    const storeId = sessionStorage.getItem('storeId');
    const storeNo = sessionStorage.getItem('storeNo');

    const calendarRef = useRef(null);  // FullCalendar ref

    //고정휴무
    const [dayOffDayList, setDayOffDayList] = useState([]); //고정휴무 저장하기
    const [offDay, setOffDay] = useState([]); //고정휴무 불러오기
    const [isEditing, setIsEditing] = useState(false); //고정휴무 수정상태

    //지정휴무
    const [dayOffSet, setDayOffSet] = useState({ //추가리스트에 담기 위한
        dayOffStart: null,
        dayOffEnd: null,
    });
    const [dayOffSetList, setDayOffSetList] = useState([]); //지정휴무 등록
    const [offSet, setOffSet] = useState([]);

    const [selectingStart, setSelectingStart] = useState(true); // Start date selection mode

    useEffect(() => {
        const fetchDay = async () => {
            try {
                const respDay = await axios.get(`/adminStore/getOffDay?storeNo=${storeNo}`);
                setOffDay(respDay.data);

                const respSet = await axios.get(`/adminStore/getOffSet?storeNo=${storeNo}`);
                setOffSet(Array.isArray(respSet.data) ? respSet.data : []);

            } catch (error) {
                console.log("휴무 부르는 중 error", error);
            }
        }
        fetchDay();
    }, []);


    //고정휴무 수정상태
    const handleEditClick = () => {
        setIsEditing(prev => !prev);
    }

    //고정휴무
    const handleChangeDayOff = (day) => {
        // 클릭한 요일이 기존 offDay에 포함되어 있으면 제거, 아니면 추가
        const isAlreadyOffDay = offDay.includes(day);
        const updatedOffDay = isAlreadyOffDay
        ? offDay.filter(d => d !== day)  // offDay에서 제거
        : [...offDay, day];  // offDay에 추가

        // offDay를 업데이트
        setOffDay(updatedOffDay);

        // dayOffDayList도 업데이트 (offDay와 동일한 방식으로 토글)
        setDayOffDayList(updatedOffDay);
    };


    const getDateRangeEvents = () => {
        const { dayOffStart, dayOffEnd } = dayOffSet;
        if (dayOffStart && dayOffEnd) {
            return [{
                title: '휴무',
                start: dayOffStart,
                end: new Date(new Date(dayOffEnd).setDate(new Date(dayOffEnd).getDate())), // Ensure end date is fully included
                backgroundColor: 'rgba(136, 136, 136, 0.3)',
                borderColor:'rgba(136, 136, 136, 0.3)',
                textColor: 'white',
            }];
        }
        return [];
    };



    // Handle selecting dates on the calendar
    const handleCalendarChange = (date) => {
        if (selectingStart) {
            setDayOffSet(prev => ({
                ...prev,
                dayOffStart: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            }));
            setSelectingStart(false); // Switch to selecting end date
        } else {
            setDayOffSet(prev => ({
                ...prev,
                dayOffEnd: date.toISOString().split('T')[0],
            }));
            setSelectingStart(true); // Reset to selecting start date
        }
    };

    const handleDeleteSetList = (index) => {//지정된 지정휴무 삭제
        // Confirm deletion
        const confirmDelete = window.confirm("해당 지정 휴무일을 삭제하시겠습니까?");

        if (confirmDelete) {
            const setNoToDelete = offSet[index].setNo;



            const fetchSetList = async () => {
                try {
                    const resp = await axios.delete(`/adminStore/deleteOffSet?storeNo=${storeNo}&setNo=${setNoToDelete}`);

                    if (resp.data){
                        console.log("삭제 성공");

                        const updatedSetList = offSet.filter((_, idx) => idx !== index);
                        setOffSet(updatedSetList);

                    } else {
                        alert('삭제 실패');
                    }
                } catch (error) {
                    console.log("지정휴무 삭제 중 error ", error);
                }
            }

            fetchSetList(); // Call the function to delete the entry
        } else {
            // User clicked 'No', do nothing
            console.log("Deletion cancelled");
        }
    }


    const handleRegistDay = async () => {
        try {
            const dayOffDayObjects = dayOffDayList.map(day => ({
                dayOffDay: day,
                dayOffFixStatus: 'Y',
                storeId,
                storeNo,
            }));

            await axios.post('/adminStore/updateDay', {
                storeId,
                storeNo,
                dayOffDayList: dayOffDayObjects,
            });
            console.log("고정휴무등록성공");
            window.location.href="/storedayoff.admin";
        } catch (error) {
            console.log("고정휴무등록 중 error ", error);
        }
    };

    const handleRegistSet = async () => {
        const { dayOffStart, dayOffEnd } = dayOffSet;

        if (dayOffStart && dayOffEnd) {
            try {
                await axios.post('/adminStore/registDayOffSet', {
                    dayOffSetList: [{
                        dayOffStart,
                        dayOffEnd,
                        storeId,
                        storeNo,
                    }],
                });
                console.log("지정휴무 등록 성공");

                // Reset form after successful submission
                setDayOffSet({ dayOffStart: '', dayOffEnd: '' });

                // Add new event to offSet state
                setOffSet(prevOffSet => [
                    ...prevOffSet,
                    { dayOffStart, dayOffEnd },
                ]);

                // Force FullCalendar to re-render after adding new event
                if (calendarRef.current) {
                    calendarRef.current.getApi().refetchEvents();  // 새로 추가된 이벤트를 반영하도록 FullCalendar 이벤트를 리패치
                }

            } catch (error) {
                console.log("지정휴무 등록 중 error ", error);
            }
        } else {
            alert('시작일과 종료일을 제대로 입력해라');
        }
    };


    // FullCalendar 이벤트 추가
    const events = [
        ...getDateRangeEvents(),
        ...offSet.map(off => ({
            title: '휴무',
            start: off.dayOffStart,
            end: new Date(new Date(off.dayOffEnd).setDate(new Date(off.dayOffEnd).getDate() )),  // Ensure end date is fully included
            backgroundColor: 'rgba(136, 136, 136, 0.3)',  // Apply subtle red color
            borderColor:'rgba(136, 136, 136, 0.3)',
            textColor: 'white',
        })),
    ];

    // Apply custom styles to date cells using dayCellClassNames
    const getDateRangeClassNames = (date) => {
        const { dayOffStart, dayOffEnd } = dayOffSet;
        if (dayOffStart && dayOffEnd) {
            const start = new Date(dayOffStart);
            const end = new Date(dayOffEnd);
            const currentDate = new Date(date);

            if (currentDate >= start && currentDate <= end) {
                return 'highlighted-day';  // 날짜 칸에 클래스를 추가
            }
        }
        return '';
    };

    return (
    <div className="store-day-off-container">

        <div className="day-off-calendar">
            <div className="calendar-wrapper">
                <FullCalendar
                    key={offSet.length}  // `key`를 `offSet`의 길이로 설정하여 상태 변경 시 강제 리렌더링
                    ref={calendarRef}  // FullCalendar에 ref 추가
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}  // 이벤트 목록을 전달
                    dayCellClassNames={(date) => getDateRangeClassNames(date)}  // 날짜에 클래스를 적용
                    dateClick={(info) => {
                        handleCalendarChange(new Date(info.dateStr));  // 날짜 클릭 시 처리
                    }}
                    onDateSelect={handleCalendarChange}  // 날짜 선택 시 처리
                    eventContent={(eventInfo) => {
                    return (
                        <div>{eventInfo.event.title}</div>
                        );
                    }}
                />
                <div className="calendar-add">
                    <input type="date" value={dayOffSet.dayOffStart || ''} onChange={(e) => setDayOffSet(prev => ({ ...prev, dayOffStart: e.target.value }))}/>
                    <input type="date" value={dayOffSet.dayOffEnd || ''} onChange={(e) => setDayOffSet(prev => ({ ...prev, dayOffEnd: e.target.value }))}/>
                    <button type="button" className="day-off add" onClick={handleRegistSet}>
                        추가
                    </button>
                </div>
            </div>
        </div>

        <div className="day-off-fix">
            <div className="day-off-title">
                <label>고정휴무</label>
                <i className="bi bi-pencil-square" onClick={handleEditClick} style={{display: isEditing ? 'none' : 'inline'}}/>
                {isEditing && (
                    <button type="button" className="day-off-btn" onClick={handleRegistDay}>
                        저장
                    </button>
                )}
            </div>

            <div className="check-day-off">
                {['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'].map(day => (
                    <div
                        className={`check-day ${offDay.includes(day) ? 'off-day' : ''} ${dayOffDayList.includes(day) ? 'active' : ''}${isEditing ? 'editable' : ''}`}
                        key={day}
                        onClick={isEditing ? () => handleChangeDayOff(day) : null} // Prevent click if not editing
                    >
                        <input
                            type="checkbox"
                            name="dayOffDay"
                            value={day}
                            checked={dayOffDayList.includes(day)}
                            onChange={handleChangeDayOff}
                            style={{ display: 'none' }}  // 체크박스를 숨깁니다
                        />
                        <span>{day}</span>
                    </div>
                ))}
            </div>
        </div>


        <div className="day-off-set-list">
            <label>지정휴무 목록</label>
            {offSet.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>시작일</th>
                            <th>종료일</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {offSet.map((offSetItem, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{offSetItem.dayOffStart}</td>
                                <td>{offSetItem.dayOffEnd}</td>
                                <td style={{textAlign:'center', padding:'0'}}>
                                <button className="trash-btn" type="button" onClick={() => handleDeleteSetList(index)}>
                                    <i className="bi bi-trash"></i>
                                </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div>지정된 휴무일 없음</div>
            )}
        </div>
    </div>
);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<StoreDayOff />);
