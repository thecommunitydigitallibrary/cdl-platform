import Image from "next/image";
import React from "react";
import Container from "./container";

// Do we need images?

// import userOneImg from "../public/images/??.jpg";
// import userTwoImg from "../public/images/??.jpg";
// import userThreeImg from "../public/images/??.jpg";

const Testimonials = () => {
    return (
        <Container>
            <div className="grid gap-10 lg:grid-cols-2 xl:grid-cols-3 px-4">
                <div className="lg:col-span-2 xl:col-auto">
                    
                     {/* lol names for now, do we need img? or just set to initial */}

                    <div className="flex flex-col justify-between w-full h-full bg-gray-100 px-14 rounded-2xl py-14 dark:bg-trueGray-800">
                        <p className="text-xl leading-normal ">
                            It's like my own little knowledge-sharing <Mark>community</Mark>, and the extension just makes it super convenient to save and share webpages. Love it!"
                        </p>
                        <Avatar
                            //   image={userOneImg}
                            name="Dr X"
                            title="Teaches Chaos Theory to Pigeons "
                        />
                    </div>
                </div>
                <div className="">
                    <div className="flex flex-col justify-between w-full h-full bg-gray-100 px-14 rounded-2xl py-14 dark:bg-trueGray-800">
                        <p className="text-xl leading-normal ">
                            The CDL is like a grad student's <Mark>best friend </Mark> - it's super easy to use, helps me find all the resources I need for my research, and allows me to connect and share with other students in a way that makes studying way more fun!
                        </p>


                        <Avatar
                            //   image={userTwoImg}
                            name="Captain Banana"
                            title="Chief of Slippery Operations"
                        />
                    </div>
                </div>
                <div className="">
                    <div className="flex flex-col justify-between w-full h-full bg-gray-100 px-14 rounded-2xl py-14 dark:bg-trueGray-800">
                        <p className="text-xl leading-normal ">
                            I've been the CDL for multiple classes, and it has been a <Mark>game-changer</Mark> in terms of organizing resources, facilitating collaboration, and enhancing the learning experience for my students.
                        </p>

                        <Avatar
                            //   image={userThreeImg}
                            name="Professor Pinto Bean"
                            title="Master of Squirrel Linguistics"
                        />
                    </div>
                </div>
            </div>
        </Container>
    );
}

function Avatar(props) {
    return (
        <div className="flex items-center mt-8 space-x-3">
            <div className="flex-shrink-0 overflow-hidden rounded-full w-14 h-14">
                <Image
                    src={props.image}
                    width="40"
                    height="40"
                    alt="Avatar"
                    placeholder="blur"
                />
            </div>
            <div>
                <div className="text-lg font-medium">{props.name}</div>
                <div className="text-gray-600 dark:text-gray-400">{props.title}</div>
            </div>
        </div>
    );
}

function Mark(props) {
    return (
        <>
            {" "}
            <mark className="text-blue-500 bg-indigo-100 rounded-md ring-indigo-100 ring-4 dark:ring-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                {props.children}
            </mark>{" "}
        </>
    );
}

export default Testimonials;