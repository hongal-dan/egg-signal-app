import { speakingStyle } from '@/utils/meeting/meetingUtils';
import { getUserGender, getUserID } from '@/utils/meeting/openviduUtils';
import { Publisher, StreamManager } from 'openvidu-browser';
import React, { RefObject } from 'react'
import UserVideoComponent from './UserVideoComponent';
import MikeMuteButton from './MikeMuteButton';
import dynamic from 'next/dynamic';

const DynamicEmoji = dynamic(() => import("@/containers/meeting/emoji"), {
  ssr: false,
});

interface sessionProps {
  publisher: Publisher | undefined;
  sortedSubscribers: StreamManager[];
  speakingPublisherIds: string[];
  sessionRef: RefObject<HTMLDivElement>;
  videoContainerRef: RefObject<HTMLDivElement>;
  pubRef: RefObject<HTMLDivElement>;
  subRef: RefObject<HTMLDivElement[]>;
}

const SessionComponent = (props: sessionProps) => {
  const { publisher, sortedSubscribers, speakingPublisherIds, sessionRef, videoContainerRef, pubRef, subRef } = props;
  return (
    <div
    id="session"
    className="h-full flex justify-center items-center transition-colors duration-[1500ms] ease-in-out"
    ref={sessionRef}
  >
    <div
      className="relative col-md-6 video-container"
      ref={videoContainerRef}
    >
      {publisher !== undefined ? (
        <div
          className={`stream-container col-md-6 col-xs-6 pub custom-shadow ${getUserGender(publisher)}`}
          id={getUserID(publisher)}
          ref={pubRef}
          style={speakingStyle(publisher, speakingPublisherIds)}
        >
          <UserVideoComponent
            streamManager={publisher}
          />
        </div>
      ) : null}
      {sortedSubscribers.map((sub, idx) => (
        <div
          key={sub.stream.streamId}
          data-key={sub.stream.streamId}
          className={`stream-container col-md-6 col-xs-6 sub custom-shadow ${getUserGender(sub)}`}
          id={getUserID(sub)}
          ref={el => {
            (subRef.current as (HTMLDivElement | null)[])[idx] = el;
          }}
          style={speakingStyle(sub, speakingPublisherIds)}
        >
          <UserVideoComponent
            key={sub.stream.streamId}
            streamManager={sub}
          />
        </div>
      ))}
    </div>
    <div className="fixed bottom-3 left-0 right-0 flex justify-center">
      <div className="relative bg-white p-2 rounded-lg shadow-md">
        <DynamicEmoji />
        <MikeMuteButton publisher={publisher} />
      </div>
    </div>
  </div>
  )
}

export default SessionComponent