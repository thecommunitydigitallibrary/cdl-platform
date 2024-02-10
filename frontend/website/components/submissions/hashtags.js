import React from 'react'
import useSubmissionStore from '../../store/submissionStore';
export default function Hashtags() {
    const { submissionHashtags } = useSubmissionStore();
    if (Array.isArray(submissionHashtags)) {
        return (
            <div className="flex flex-wrap justify-end">
                {/* justify-end */}
                {submissionHashtags.map((tag, index) => (
                    <a
                        key={index}
                        href={"/search?query=" + encodeURIComponent(tag) + "&community=all&page=0"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            marginRight: '8px',
                            fontSize: 'small',
                        }}
                    >
                        {tag}
                    </a>
                ))}
            </div>
        );
    }
    return <></>;
}



