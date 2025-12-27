'use client';

import React from 'react';
import Link from 'next/link';
import styles from './bar.module.css';

export default function Bar() {
  return (
    <div className={styles.bar}>
      <div className={styles.bar__content}>
        <div className={styles.bar__playerProgress}></div>
        <div className={styles.bar__playerBlock}>
          <div className={styles.bar__player}>
            <div className={styles.player__controls}>
              <div className={styles.player__btnPrev}>
                <svg className={styles.player__btnPrevSvg}>
                  <use xlinkHref="/icon/prev.svg"></use>
                </svg>
              </div>
              <div className={`${styles.player__btnPlay} ${styles.btn}`}>
                <svg className={styles.player__btnPlaySvg}>
                  <use xlinkHref="/icon/play.svg"></use>
                </svg>
              </div>
              <div className={styles.player__btnNext}>
                <svg className={styles.player__btnNextSvg}>
                  <use xlinkHref="/icon/next.svg"></use>
                </svg>
              </div>
              <div className={`${styles.player__btnRepeat} ${styles.btnIcon}`}>
                <svg className={styles.player__btnRepeatSvg}>
                  <use xlinkHref="/icon/repeat.svg"></use>
                </svg>
              </div>
              <div className={`${styles.player__btnShuffle} ${styles.btnIcon}`}>
                <svg className={styles.player__btnShuffleSvg}>
                  <use xlinkHref="/icon/shuffle.svg"></use>
                </svg>
              </div>
            </div>

            <div className={styles.player__trackPlay}>
              <div className={styles.trackPlay__contain}>
                <div className={styles.trackPlay__image}>
                  <svg className={styles.trackPlay__svg}>
                    <use xlinkHref="/icon/note.svg"></use>
                  </svg>
                </div>
                <div className={styles.trackPlay__author}>
                  <Link className={styles.trackPlay__authorLink} href="">
                    Ты та...
                  </Link>
                </div>
                <div className={styles.trackPlay__album}>
                  <Link className={styles.trackPlay__albumLink} href="">
                    аста
                  </Link>
                </div>
              </div>

              <div className={styles.trackPlay__likeDis}>
                <div className={`${styles.trackPlay__like} ${styles.btnIcon}`}>
                  <svg className={styles.trackPlay__likeSvg}>
                    <use xlinkHref="/icon/like.svg"></use>
                  </svg>
                </div>
                <div
                  className={`${styles.trackPlay__dislike} ${styles.btnIcon}`}
                >
                  <svg className={styles.trackPlay__dislikeSvg}>
                    <use xlinkHref="/icon/dislike.svg"></use>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.bar__volumeBlock}>
            <div className={styles.volume__content}>
              <div className={styles.volume__image}>
                <svg className={styles.volume__svg}>
                  <use xlinkHref="/icon/volume.svg"></use>
                </svg>
              </div>
              <div className={styles.volume__progress}>
                <input
                  className={`${styles.volume__progressLine} ${styles.btn}`}
                  type="range"
                  name="range"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
