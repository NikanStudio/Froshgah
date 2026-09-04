const SUPABASE_URL = "https://pjgilkrjnpkpjasvsyrr.supabase.co";
const SUPABASE_KEY = "sb_publishable_VCAZbBm7tFb5jNgLR-a38A_A5dqeJVP";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


let allAds = [];
let currentCategory = "all";


const categoryIcons = {
    digital: "📱",
    car: "🚗",
    home: "🏠",
    clothes: "👕",
    other: "📦"
};


/* =========================
   شروع سایت
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await updateUserInterface();
        await loadAds();

    }
);


/* =========================
   پنجره‌ها
========================= */

function openAuth() {

    document
        .getElementById("authModal")
        .classList.add("show");

}


async function openAddAd() {

    const {
        data: {
            user
        }
    } = await supabaseClient
        .auth
        .getUser();


    if (!user) {

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


/* =========================
   ورود و ثبت‌نام
========================= */

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


    /* ابتدا تلاش برای ورود */

    const {
        data: loginData,
        error: loginError
    } = await supabaseClient
        .auth
        .signInWithPassword({

            email: email,
            password: password

        });


    if (!loginError && loginData.user) {

        closeModal("authModal");

        alert(
            "با موفقیت وارد بازینو شدی!"
        );

        await updateUserInterface();
        await loadAds();

        return;

    }


    /* اگر ورود انجام نشد، ثبت‌نام */

    const {
        data: signupData,
        error: signupError
    } = await supabaseClient
        .auth
        .signUp({

            email: email,
            password: password,

            options: {
                emailRedirectTo:
                    "https://nikanstudio.github.io/Froshgah/"
            }

        });


    if (signupError) {

        alert(
            "خطا: " +
            signupError.message
        );

        return;

    }


    if (signupData.user) {

        closeModal("authModal");

        document
            .getElementById("emailInput")
            .value = "";

        document
            .getElementById("passwordInput")
            .value = "";


        alert(
            "حساب ساخته شد! اگر ایمیل تأیید دریافت کردی، آن را تأیید کن."
        );

        await updateUserInterface();

    }

}


/* =========================
   رابط کاربری کاربر
========================= */

async function updateUserInterface() {

    const {
        data: {
            user
        }
    } = await supabaseClient
        .auth
        .getUser();


    const loginButton = document.querySelector(
        ".login-btn"
    );


    if (!loginButton) {

        return;

    }


    if (user) {

        loginButton.textContent = "خروج";

        loginButton.onclick = logoutUser;

    } else {

        loginButton.textContent =
            "ورود / ثبت‌نام";

        loginButton.onclick = openAuth;

    }

}


/* =========================
   خروج
========================= */

async function logoutUser() {

    const {
        error
    } = await supabaseClient
        .auth
        .signOut();


    if (error) {

        alert(
            "خروج انجام نشد."
        );

        return;

    }


    alert(
        "از حساب بازینو خارج شدی."
    );


    await updateUserInterface();
    await loadAds();

}


/* =========================
   بررسی خودکار آگهی
========================= */

function checkAdContent(
    title,
    description
) {

    const text = (
        title +
        " " +
        description
    )
        .toLowerCase();


    const blockedWords = [

        "پورن",
        "پورنو",
        "سکس",
        "sex",
        "xxx",
        "onlyfans"

    ];


    for (const word of blockedWords) {

        if (
            text.includes(word)
        ) {

            return false;

        }

    }


    return true;

}


/* =========================
   ثبت آگهی
========================= */

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


    if (Number(price) < 0) {

        alert(
            "قیمت نمی‌تواند منفی باشد."
        );

        return;

    }


    if (
        !/^09\d{9}$/.test(phone)
    ) {

        alert(
            "شماره موبایل باید ۱۱ رقم و با 09 شروع شود."
        );

        return;

    }


    /* بررسی خودکار */

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
        },
        error: userError
    } = await supabaseClient
        .auth
        .getUser();


    if (userError || !user) {

        alert(
            "برای ثبت آگهی ابتدا وارد حساب خود شو."
        );

        openAuth();

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("ads")
        .insert({

            user_id:
                user.id,

            title:
                title,

            description:
                description,

            price:
                Number(price),

            category:
                category,

            phone:
                phone

        });


    if (error) {

        console.error(error);

        alert(
            "خطا در ثبت آگهی: " +
            error.message
        );

        return;

    }


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


    alert(
        "آگهی با موفقیت منتشر شد!"
    );


    await loadAds();

}


/* =========================
   دریافت آگهی‌ها
========================= */

async function loadAds() {

    const grid = document.getElementById(
        "adsGrid"
    );


    if (!grid) {

        return;

    }


    grid.innerHTML = `
        <div class="empty-state">
            در حال دریافت آگهی‌ها...
        </div>
    `;


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

        console.error(error);

        grid.innerHTML = `
            <div class="empty-state">
                خطا در دریافت آگهی‌ها
            </div>
        `;

        return;

    }


    allAds = data || [];


    applyFilters();

}


/* =========================
   فیلترها
========================= */

function applyFilters() {

    const searchInput = document.getElementById(
        "searchInput"
    );


    const searchText = searchInput
        ? searchInput.value
            .trim()
            .toLowerCase()
        : "";


    let result = [...allAds];


    if (
        currentCategory !== "all"
    ) {

        result = result.filter(ad => {

            return (
                ad.category ===
                currentCategory
            );

        });

    }


    if (searchText) {

        result = result.filter(ad => {

            const title = String(
                ad.title || ""
            )
                .toLowerCase();


            const description = String(
                ad.description || ""
            )
                .toLowerCase();


            return (
                title.includes(searchText) ||
                description.includes(searchText)
            );

        });

    }


    renderAds(result);

}


/* =========================
   نمایش آگهی‌ها
========================= */

async function renderAds(ads) {

    const grid = document.getElementById(
        "adsGrid"
    );

    const count = document.getElementById(
        "adsCount"
    );


    const {
        data: {
            user
        }
    } = await supabaseClient
        .auth
        .getUser();


    if (count) {

        count.textContent =
            ads.length +
            " آگهی پیدا شد";

    }


    if (!ads.length) {

        grid.innerHTML = `
            <div class="empty-state">
                هنوز آگهی‌ای پیدا نشد.
            </div>
        `;

        return;

    }


    grid.innerHTML = ads.map(ad => {

        const icon =
            categoryIcons[
                ad.category
            ] || "📦";


        const isOwner =
            user &&
            user.id === ad.user_id;


        return `

            <article class="ad-card">

                <div class="ad-image">

                    ${icon}

                </div>


                <div class="ad-content">

                    <h3>

                        ${escapeHTML(
                            ad.title
                        )}

                    </h3>


                    <p>

                        ${escapeHTML(
                            ad.description
                        )}

                    </p>


                    <div class="ad-price">

                        ${Number(
                            ad.price
                        ).toLocaleString(
                            "fa-IR"
                        )}

                        تومان

                    </div>


                    <div class="ad-phone">

                        📞

                        ${escapeHTML(
                            ad.phone
                        )}

                    </div>


                    ${

                        isOwner

                        ?

                        `

                        <button
                            type="button"
                            class="ad-delete"
                            onclick="deleteAd('${ad.id}')">

                            حذف آگهی

                        </button>

                        `

                        :

                        ""

                    }

                </div>

            </article>

        `;

    }).join("");

}


/* =========================
   حذف یک آگهی
========================= */

async function deleteAd(adId) {

    const {
        data: {
            user
        }
    } = await supabaseClient
        .auth
        .getUser();


    if (!user) {

        alert(
            "ابتدا وارد حساب خود شو."
        );

        return;

    }


    const confirmed = confirm(
        "آیا مطمئنی که می‌خواهی این آگهی را حذف کنی؟"
    );


    if (!confirmed) {

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("ads")
        .delete()
        .eq(
            "id",
            adId
        )
        .eq(
            "user_id",
            user.id
        );


    if (error) {

        console.error(error);

        alert(
            "حذف آگهی انجام نشد: " +
            error.message
        );

        return;

    }


    alert(
        "آگهی حذف شد."
    );


    await loadAds();

}


/* =========================
   جستجو
========================= */

function searchAds() {

    applyFilters();

}


/* =========================
   دسته‌بندی
========================= */

function filterCategory(category) {

    currentCategory = category;

    applyFilters();

}


/* =========================
   جلوگیری از HTML ناخواسته
========================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value || "";


    return div.innerHTML;

}


/* =========================
   تغییر وضعیت ورود
========================= */

supabaseClient
    .auth
    .onAuthStateChange(
        () => {

            updateUserInterface();
            loadAds();

        }
    );


/* =========================
   جستجو با Enter
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                searchAds
            );

        }

    }
);
