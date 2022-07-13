// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';

import {matchPath, useHistory} from 'react-router-dom';

import {useDispatch, useSelector} from 'react-redux';

import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';
import {isTeamSameWithCurrentTeam} from 'mattermost-redux/selectors/entities/teams';
import {focusPost} from 'components/permalink_view/actions';
import {GlobalState} from 'types/store';

export type Props = {
    className?: string;
    children?: JSX.Element;
    link: string;
};

type LinkParams = {
    postId: string;
    teamName: string;
}

const getTeamAndPostIdFromLink = (link: string) => {
    const match = matchPath<LinkParams>(link, {path: '/:teamName/pl/:postId'});
    return match!.params;
};

const PostAttachmentContainer = (props: Props) => {
    const {children, className, link} = props;
    const history = useHistory();

    const params = getTeamAndPostIdFromLink(link);

    const dispatch = useDispatch();

    const userId = useSelector(getCurrentUserId);
    const shouldFocusPostWithoutRedirect = useSelector((state: GlobalState) => isTeamSameWithCurrentTeam(state, params.teamName));

    const handleOnClick = useCallback((e) => {
        const {tagName} = e.target;
        e.stopPropagation();
        const elements = ['A', 'IMG', 'BUTTON', 'I'];

        if (!elements.includes(tagName) && (e.target.getAttribute('role') !== 'button' && e.target.className !== `attachment attachment--${className}`)) {
            const classNames = ['icon icon-menu-down', 'icon icon-menu-right', 'post-image', 'file-icon'];

            if (params && shouldFocusPostWithoutRedirect) {
                dispatch(focusPost(params.postId, link, userId, {skipRedirectReplyPermalink: true}));
                return;
            }
            if (!classNames.some((className) => e.target.className.includes(className)) && e.target.id !== 'image-name-text') {
                history.push(link);
            }
        }
    }, [className, dispatch, history, link, params, shouldFocusPostWithoutRedirect, userId]);
    return (
        <div
            className={`attachment attachment--${className}`}
            role={'button'}
            onClick={handleOnClick}
        >
            <div className={`attachment__content attachment__content--${className}`}>
                <div className={`clearfix attachment__container attachment__container--${className}`}>
                    <div className={`attachment__body__wrap attachment__body__wrap--${className}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostAttachmentContainer;
