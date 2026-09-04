const SUPABASE_URL = "https://pjgilkrjnpkpjasvsyrr.supabase.co";
const SUPABASE_KEY = "sb_publishable_VCAZbBm7tFb5jNgLR-a38A_A5dqeJVP";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let allAds = [];
let currentCategory = "all";

const categoryNames = {
    digital: "دیجیتال",
    car: "خودرو",
    home: "خانه",
    clothes: "پوشاک",
    other: "سایر"
};

const categoryIcons = {
    digital: "📱",
    car: "🚗",
    home: "🏠",
    clothes: "👕",
    other: "📦"
};


/* شروع سایت */

document.addEventListener("DOMContentLoaded", async () => {

    await loadAds();
    await updateUserInterface();

});


/* باز و بسته کردن پنجره‌ها */

function openAuth() {

    document
        .getElementById("authModal")
        .classList.add("show");

}


async function openAddAd() {

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();


    if (!session) {

        alert(
            "برای ثبت آگهی ابتدا وارد حساب کاربری خود شو."
        );

        openAuth();

        return;

    }


    document
        .getElementById("adModal")
        .classList.add("show");

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList.remove("show");

}


/* ثبت‌نام و ورود */

async function loginUser() {

    const email = document
        .getElementById("emailInput")
        .value
        .trim();

    const password = document
        .getElementById("passwordInput")
        .value;


    if (!email || !password) {

        alert(
            "ایمیل و رمز عبور را وارد کن."
        );

        return;

    }


    if (password.length < 6) {

        alert(
            "رمز عبور باید حداقل ۶ کاراکتر باشد."
        );

        return;

    }


    const {
        data: loginData,
        error: loginError
    } = await supabaseClient.auth.signInWithPassword({

        email: email,
        password: password

    });


    if (!loginError && loginData.user) {

        closeModal("authModal");

        alert(
            "با موفقیت وارد بازینو شدی!"
        );

        await updateUserInterface();

        return;

    }


    const {
        data: signupData,
        error: signupError
    } = await supabaseClient.auth.signUp({

        email: email,
        password: password

    });


    if (signupError) {

        alert(
            signupError.message
        );

        return;

    }


    if (signupData.user) {

        closeModal("authModal");

        alert(
            "حساب ساخته شد. ایمیلت را برای تأیید بررسی کن."
        );

        await updateUserInterface();

    }

}


/* نمایش وضعیت کاربر */

async function updateUserInterface() {

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();


    const loginButton = document.querySelector(
        ".login-btn"
    );


    if (session) {

        loginButton.textContent = "خروج";

        loginButton.onclick = logoutUser;

    } else {

        loginButton.textContent = "ورود / ثبت‌نام";

        loginButton.onclick = openAuth;

    }

}


/* خروج */

async function logoutUser() {

    await supabaseClient.auth.signOut();

    alert(
        "از حساب خارج شدی."
    );

    await updateUserInterface();

}


/* بررسی اولیه آگهی */

function checkAdContent(
    title,
    description
) {

    const text = (
        title + " " + description
    ).toLowerCase();


    const blockedWords = [

        "پورن",
        "پورنو",
        "سکس",
        "sex",
        "xxx",
        "onlyfans"

    ];


    for (const word of blockedWords) {

        if (text.includes(word)) {

            return false;

        }

    }


    return true;

}


/* ثبت آگهی */

async function addAd() {

    const title = document
        .getElementById("adTitle")
        .value
        .trim();

    const description = document
        .getElementById("adDescription")
        .value
        .trim();

    const price = document
        .getElementById("adPrice")
        .value;

    const category = document
        .getElementById("adCategory")
        .value;

    const phone = document
        .getElementById("phoneInput")
        .value
        .trim();


    if (
        !title ||
        !description ||
        !price ||
        !phone
    ) {

        alert(
            "همه بخش‌های آگهی را کامل کن."
        );

        return;

    }


    if (
        !/^09\d{9}$/.test(phone)
    ) {

        alert(
            "شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد."
        );

        return;

    }


    if (
        !checkAdContent(
            title,
            description
        )
    ) {

        alert(
            "آگهی شما به دلیل داشتن محتوای نامناسب منتشر نشد."
        );

        return;

    }


    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();


    if (!user) {

        alert(
            "ابتدا وارد حساب خود شو."
        );

        openAuth();

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("ads")
        .insert({

            user_id: user.id,
            title: title,
            description: description,
            price: Number(price),
            category: category,
            phone: phone

        });


    if (error) {

        alert(
            "خطا در ثبت آگهی: " +
            error.message
        );

        return;

    }


    alert(
        "آگهی با موفقیت منتشر شد."
    );


    document
        .getElementById("adTitle")
        .value = "";

    document
        .getElementById("adDescription")
        .value = "";

    document
        .getElementById("adPrice")
        .value = "";

    document
        .getElementById("phoneInput")
        .value = "";


    closeModal("adModal");

    await loadAds();

}


/* دریافت آگهی‌ها */

async function loadAds() {

    const {
        data,
        error
    } = await supabaseClient
        .from("ads")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        document
            .getElementById("adsGrid")
            .innerHTML = `
                <div class="empty-state">
                    خطا در دریافت آگهی‌ها
                </div>
            `;

        console.error(error);

        return;

    }


    allAds = data || [];

    renderAds(allAds);

}


/* نمایش آگهی‌ها */

function renderAds(ads) {

    const grid = document.getElementById(
        "adsGrid"
    );

    const count = document.getElementById(
        "adsCount"
    );


    count.textContent =
        ads.length + " آگهی پیدا شد";


    if (!ads.length) {

        grid.innerHTML = `
            <div class="empty-state">
                هنوز آگهی‌ای ثبت نشده.<br>
                اولین آگهی بازینو را تو ثبت کن!
            </div>
        `;

        return;

    }


    grid.innerHTML = ads.map(ad => {

        const icon =
            categoryIcons[ad.category] || "📦";


        return `

            <article class="ad-card">

                <div class="ad-image">

                    ${icon}

                </div>


                <div class="ad-content">

                    <h3>

                        ${escapeHTML(ad.title)}

                    </h3>


                    <p>

                        ${escapeHTML(ad.description)}

                    </p>


                    <div class="ad-price">

                        ${Number(
                            ad.price
                        ).toLocaleString("fa-IR")}

                        تومان

                    </div>


                    <div class="ad-phone">

                        📞

                        ${escapeHTML(ad.phone)}

                    </div>


                    ${canDelete(ad.user_id)}

                </div>

            </article>

        `;

    }).join("");

}


/* آیا کاربر می‌تواند حذف کند؟ */

function canDelete(ownerId) {

    const currentUserId = localStorage.getItem(
        "bazinoUserId"
    );


    if (currentUserId === ownerId) {

        return `

            <button
                type="button"
                class="ad-delete"
                onclick="deleteAd('${ownerId}')">

                حذف آگهی

            </button>

        `;

    }


    return "";

}


/* حذف آگهی */

async function deleteAd(ownerId) {

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();


    if (!user) {

        return;

    }


    if (user.id !== ownerId) {

        alert(
            "فقط صاحب آگهی می‌تواند آن را حذف کند."
        );

        return;

    }


    const confirmDelete = confirm(
        "آیا مطمئنی که می‌خواهی آگهی را حذف کنی؟"
    );


    if (!confirmDelete) {

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("ads")
        .delete()
        .eq(
            "user_id",
            user.id
        );


    if (error) {

        alert(
            "حذف آگهی انجام نشد."
        );

        return;

    }


    await loadAds();

}


/* جستجو */

function searchAds() {

    const text = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();


    const result = allAds.filter(ad => {

        return (
            ad.title
                .toLowerCase()
                .includes(text)

            ||

            ad.description
                .toLowerCase()
                .includes(text)
        );

    });


    renderAds(result);

}


/* دسته‌بندی */

function filterCategory(category) {

    currentCategory = category;


    if (category === "all") {

        renderAds(allAds);

        return;

    }


    const result = allAds.filter(ad => {

        return (
            ad.category === category
        );

    });


    renderAds(result);

}


/* جلوگیری از HTML ناخواسته */

function escapeHTML(text) {

    const div = document.createElement(
        "div"
    );

    div.textContent = text;

    return div.innerHTML;

}


/* وضعیت ورود کاربر */

supabaseClient.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        if (session?.user) {

            localStorage.setItem(
                "bazinoUserId",
                session.user.id
            );

        } else {

            localStorage.removeItem(
                "bazinoUserId"
            );

        }


        updateUserInterface();

        loadAds();

    }
);
