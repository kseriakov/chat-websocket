import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import * as actions from "../store/actions/auth";

import { LockOutlined, UserOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Form, Input, Spin } from "antd";

const Login = () => {
    const formRef = useRef();
    const { loading } = useSelector(({ authReducer }) => authReducer);
    const { error } = useSelector(({ authReducer }) => authReducer);
    const dispatch = useDispatch();

    const onFinish = (values) => {
        dispatch(actions.authLogin(values.username, values.password));
        const form = formRef.current;
        form.setFieldValue("password", "");
    };

    const spiner = loading ? <Spinner /> : null;
    const errorMessage = error !== null ? <ErrorAuth /> : null;

    return (
        <div className="login">
            <div className="spinner">{spiner}</div>
            {errorMessage}
            <div className="login__welcome">Welcome to the Chat!</div>
            <Form name="normal_login" className="login-form" onFinish={onFinish} ref={formRef}>
                <Form.Item
                    name="username"
                    rules={[
                        {
                            required: true,
                            message: "Please input your username!",
                        },
                    ]}
                >
                    <Input
                        prefix={<UserOutlined className="site-form-item-icon" />}
                        placeholder="Username"
                    />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[
                        {
                            required: true,
                            message: "Please input your password!",
                        },
                    ]}
                >
                    <Input
                        prefix={<LockOutlined className="site-form-item-icon" />}
                        type="password"
                        placeholder="Password"
                    />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-form-button">
                        Log in
                    </Button>{" "}
                    or <Link to="/register">register now!</Link>
                </Form.Item>
            </Form>
        </div>
    );
};

export const Spinner = () => (
    <Spin
        indicator={
            <LoadingOutlined
                style={{
                    fontSize: 24,
                }}
                spin
            />
        }
    />
);

const ErrorAuth = () => {
    return <div className="login__error">You input uncorrect login or password</div>;
};

export default Login;
