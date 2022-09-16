import { Button, Form, Input } from "antd";
import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Spinner } from "./Login";
import * as actions from "../store/actions/auth";

const formItemLayout = {
    labelCol: {
        xs: {
            span: 22,
        },
        sm: {
            span: 11,
        },
    },
    wrapperCol: {
        xs: {
            span: 22,
        },
        sm: {
            span: 16,
        },
    },
};
const tailFormItemLayout = {
    wrapperCol: {
        xs: {
            span: 24,
            offset: 0,
        },
        sm: {
            span: 24,
            offset: 10,
        },
    },
};

const Register = () => {
    const { loading } = useSelector(({ authReducer }) => authReducer);
    const { error } = useSelector(({ authReducer }) => authReducer);
    const { token } = useSelector(({ authReducer }) => authReducer);
    const dispatch = useDispatch();

    const [form] = Form.useForm();

    const navigate = useNavigate();

    const onFinish = ({username, password, confirm}) => {
        dispatch(actions.authRegister(username, password, confirm));
        form.setFieldValue("password", "");
        form.setFieldValue("confirm", "");
    };

    useEffect(() => {
        if (token) {
            navigate("/");
        }
    }, [token]);

    const spiner = loading ? <Spinner /> : null;
    const errorMessage = error !== null ? <ErrorReg /> : null;

    return (
        <div className="login">
            {errorMessage}
            <div className="spinner">{spiner}</div>
            <div className="login__welcome">Registration</div>
            <Form
                {...formItemLayout}
                form={form}
                name="register"
                onFinish={onFinish}
                scrollToFirstError
            >
                <Form.Item
                    name="username"
                    label="Username"
                    rules={[
                        {
                            required: true,
                            message: "Please input your username!",
                            whitespace: true,
                        },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                        {
                            required: true,
                            message: "Please input your password!",
                        },
                    ]}
                    hasFeedback
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item
                    name="confirm"
                    label="Confirm"
                    dependencies={["password"]}
                    hasFeedback
                    rules={[
                        {
                            required: true,
                            message: "Please confirm your password!",
                        },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (
                                    !value ||
                                    getFieldValue("password") === value
                                ) {
                                    return Promise.resolve();
                                }

                                return Promise.reject(
                                    new Error(
                                        "The two passwords that you entered do not match!"
                                    )
                                );
                            },
                        }),
                    ]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item {...tailFormItemLayout}>
                    <Button type="primary" htmlType="submit">
                        Register
                    </Button> or <Link to="/">Login</Link>
                </Form.Item>
            </Form>
        </div>
    );
};

const ErrorReg = () => {
    return (
        <div className="login__error">
            Registration failed, try input another Username or stronger password
        </div>
    );
};

export default Register;
