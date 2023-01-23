// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {HTMLAttributes, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';

import {requestAnimationFrameForMouseMove, isOverLimit, shouldSnapWhenSizeGrown, shouldSnapWhenSizeShrunk, setWidth, toggleColResizeCursor, resetStyle} from './utils';

interface ResizableProps extends HTMLAttributes<'div'> {
    maxWidth: number;
    minWidth: number;
    defaultWidth: number;
    initialWidth?: number;
    enabled: {
        left: boolean;
        right: boolean;
    };
    onResize?: (width: number) => void;
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
    onLineDoubleClick?: () => void;
    onInit?: (width: number) => void;
    onLimitChange?: (width: number) => void;
    children: React.ReactNode;
}

export type ResizeDirection = 'left' | 'right'

function Resizable({
    role,
    children,
    id,
    className,
    enabled,
    defaultWidth,
    minWidth,
    maxWidth,
    initialWidth,
    onResize,
    onResizeStart,
    onResizeEnd,
    onLineDoubleClick,
    onInit,
    onLimitChange,
}: ResizableProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const leftResizeLineRef = useRef<HTMLDivElement>(null);
    const rightResizeLineRef = useRef<HTMLDivElement>(null);

    const [isResizeLineSelected, setIsResizeLineSelected] = useState(false);
    const [dir, setDir] = useState<ResizeDirection | null>(null);

    const previousClientX = useRef(0);

    const resizeEnabled = enabled.left || enabled.right;

    const handleDoubleClick = useCallback(() => {
        const wrapperElem = wrapperRef.current;

        if (wrapperElem) {
            setWidth(wrapperElem, defaultWidth);
        }
        if (onLineDoubleClick) {
            onLineDoubleClick();
        }
    }, [defaultWidth, onLineDoubleClick]);

    const handleMouseDown = useCallback((e: React.MouseEvent, dir: ResizeDirection) => {
        previousClientX.current = e.clientX;

        setIsResizeLineSelected(true);
        setDir(dir);

        toggleColResizeCursor();

        if (onResizeStart) {
            onResizeStart();
        }
    }, [onResizeStart]);

    const handleMouseMove = useCallback(requestAnimationFrameForMouseMove((e: MouseEvent) => {
        const wrapperElem = wrapperRef.current;

        if (!previousClientX.current || !wrapperElem) {
            return;
        }

        if (!isResizeLineSelected) {
            return;
        }

        e.preventDefault();

        const resizeLine = dir === 'left' ? leftResizeLineRef.current : rightResizeLineRef.current;

        if (!resizeLine) {
            return;
        }

        const prevWidth = wrapperElem?.getBoundingClientRect().width ?? 0;
        let widthDiff = 0;

        switch (dir) {
        case 'left':
            widthDiff = e.clientX - previousClientX.current;
            break;
        case 'right':
            widthDiff = previousClientX.current - e.clientX;
            break;
        }

        const newWidth = prevWidth + widthDiff;
        previousClientX.current = e.clientX;

        if (resizeLine.classList.contains('snapped')) {
            return;
        }

        if (isOverLimit(newWidth, maxWidth, minWidth)) {
            return;
        }

        if (shouldSnapWhenSizeGrown(newWidth, prevWidth, defaultWidth) || shouldSnapWhenSizeShrunk(newWidth, prevWidth, defaultWidth)) {
            if (onResize) {
                onResize(defaultWidth);
            }

            setWidth(wrapperElem, defaultWidth);

            resizeLine.classList.add('snapped');
            setTimeout(() => {
                if (resizeLine) {
                    resizeLine.classList.remove('snapped');
                }
            }, 500);
            return;
        }

        setWidth(wrapperElem, newWidth);
        if (onResize) {
            onResize(newWidth);
        }
    }), [isResizeLineSelected, maxWidth, minWidth, dir]);

    const handleMouseUp = useCallback(() => {
        setIsResizeLineSelected(false);
        setDir(null);

        toggleColResizeCursor();

        if (onResizeEnd) {
            onResizeEnd();
        }
    }, [onResizeEnd]);

    useEffect(() => {
        if (!isResizeLineSelected || !dir) {
            return () => {};
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dir, handleMouseMove, handleMouseUp, isResizeLineSelected]);

    useLayoutEffect(() => {
        const wrapperElem = wrapperRef.current;

        if (!wrapperElem) {
            return;
        }

        const width = wrapperElem.getBoundingClientRect().width;

        if (!resizeEnabled) {
            resetStyle(wrapperElem);
            return;
        }

        if (width > maxWidth || width < minWidth) {
            setWidth(wrapperElem, defaultWidth);
            if (onLimitChange) {
                onLimitChange(defaultWidth);
            }
        }
    }, [defaultWidth, maxWidth, minWidth, resizeEnabled]);

    useLayoutEffect(() => {
        const wrapperElem = wrapperRef.current;

        if (!wrapperElem) {
            return;
        }

        wrapperElem.classList.add('prevent-animation');

        requestAnimationFrame(() => {
            if (wrapperElem) {
                wrapperElem.classList.remove('prevent-animation');
            }
        });

        if (!resizeEnabled) {
            resetStyle(wrapperElem);
            return;
        }

        if (initialWidth) {
            setWidth(wrapperElem, initialWidth);
            if (onInit) {
                onInit(initialWidth);
            }
            return;
        }
        setWidth(wrapperElem, defaultWidth);
        if (onInit) {
            onInit(defaultWidth);
        }
    }, []);

    return (
        <div
            id={id}
            className={classNames(className, 'resizeWrapper', isResizeLineSelected && 'prevent-animation dragged')}
            role={role}
            ref={wrapperRef}
        >
            {children}

            {enabled.right &&
            <div
                ref={rightResizeLineRef}
                className={classNames('resizeLine right', dir === 'right' && 'resizeLine-dragged')}
                onMouseDown={(e) => handleMouseDown(e, 'right')}
                onDoubleClick={handleDoubleClick}
            />}
            {enabled.left &&
            <div
                ref={leftResizeLineRef}
                className={classNames('resizeLine left', dir === 'left' && 'resizeLine-dragged')}
                onMouseDown={(e) => handleMouseDown(e, 'left')}
                onDoubleClick={handleDoubleClick}
            />}
        </div>
    );
}

export default Resizable;
