import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import { Spinner } from "./Login";
import * as actions from "../store/actions/logo";
import { urlServer } from "../store/actions/auth";

const UploadLogo = () => {
    const dispatch = useDispatch();

    const { logoLoading } = useSelector(({ logoReducer }) => logoReducer);
    const { logoLoaded } = useSelector(({ logoReducer }) => logoReducer);
    const { logoError } = useSelector(({ logoReducer }) => logoReducer);

    const { user_id } = useSelector(({ authReducer }) => authReducer);
    const { token } = useSelector(({ authReducer }) => authReducer);

    const [logoUrl, setLogoUrl] = useState(null);

    const logoPreview = (img) => {
        const src = URL.createObjectURL(img);
        setLogoUrl(src);
    };

    const onUlpoad = (e) => {
        if (e.target.files.lenght === 0) {
            return;
        }
        const img = e.target.files[0];
        const formData = new FormData();
        formData.append("logo", img);
        formData.append("user", user_id);

        dispatch(actions.logoUploadStart());

        const isLogoOnServer = checkLogoOnServer(token);
        if (isLogoOnServer) {
            sendData(`http://${urlServer}/api/logo/`, "PUT", formData);
        } else {
            sendData(
                `http://${urlServer}/api/create/logo/`,
                "POST",
                formData
            );
        }
    };

    // Проверка наличия фото на сервере, чтобы выбрать правильный метод запроса
    const checkLogoOnServer = async (token) => {
        const config = {
            headers: {
                Authorization: `Token ${token}`,
            },
        };

        const res = await axios.get(`http://${urlServer}/api/logo/`, config);
        if (res.data.logo) {
            return true;
        } else {
            return false;
        }
    };

    const sendData = (url, method, data) => {
        fetch(url, {
            method: method,
            body: data,
            headers: {
                Authorization: `Token ${token}`,
            },
        })
            .then((res) => {
                if (res.ok) {
                    dispatch(actions.logoUploadEnd());
                    // Показываем загруженную картинку
                    logoPreview(data.get("logo"));
                    // Загружаем ссылку с сервера в LocalStorage
                    dispatch(actions.loadServerLogo(token));
                } else {
                    dispatch(actions.logoUploadError(res.statusText));
                }
            })
            .catch((err) => dispatch(actions.logoUploadError(err)));
    };

    const LogoPreview = () => {
        return (
            <div className="sidebar__settings-upload-logo">
                <img src={logoUrl} alt="" />
            </div>
        );
    };

    const SuccessUpload = () => {
        return <p className="sidebar__settings-success">Upload success!</p>;
    };

    const ErrorUpload = () => {
        return (
            <p className="sidebar__settings-error">
                Upload finished with error, try again
            </p>
        );
    };

    const preview = logoLoaded ? <LogoPreview /> : null;
    const spinner = logoLoading ? <Spinner /> : null;
    const success = logoLoaded ? <SuccessUpload /> : null;
    const error = logoError ? <ErrorUpload /> : null;

    return (
        <div className="sidebar__settings-upload">
            <form action="" method="post" encType="multipart/form-data">
                <label
                    htmlFor="upload-logo"
                    className="sidebar__settings-upload-label"
                >
                    <div className="sidebar__settings-upload-img"></div>
                    <input
                        type="file"
                        name="logo"
                        id="upload-logo"
                        onChange={onUlpoad}
                    />
                    <span>your logo</span>
                </label>
                <button>Upload</button>
            </form>
            {spinner}
            {preview}
            {success}
            {error}
        </div>
    );
};

export default UploadLogo;
